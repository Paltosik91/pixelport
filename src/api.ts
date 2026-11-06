import type {
  Game, GameDetails, Genre, GameInput, LibraryItem, NewOrder, NewReview, Order, Player, Review,
} from "./models.js";
import { getGenres, selectGames, type CatalogFilters } from "./filters.js";
import { calculateFinalPrice } from "./price.js";

// Наш сервер ASP.NET Core (порт 5080) отвечает на адреса /api/…,
// а GitHub Pages и Live Server умеют только раздавать файлы.
export const USE_API = window.location.port === "5080";

const API_BASE = "api";
const CATALOG_URL = "data/catalog.json";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Сервер ответил ошибкой ${response.status}`);
  }
  return (await response.json()) as T;
}

function toQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  const query = filters.query.trim();
  if (query !== "") {
    params.set("q", query);
  }
  if (filters.genre !== "") {
    params.set("genre", filters.genre);
  }
  if (filters.maxPrice !== null) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.onlySale) {
    params.set("onlySale", "true");
  }
  params.set("sort", filters.sort);
  return params.toString();
}

// ===== Без сервера: весь каталог из файла, фильтры в браузере =====
let staticGames: GameDetails[] | null = null;

async function loadStaticCatalog(): Promise<GameDetails[]> {
  if (staticGames === null) {
    const raw = await getJson<Omit<GameDetails, "finalPrice">[]>(CATALOG_URL);
    staticGames = raw.map((game) => ({
      ...game,
      finalPrice: calculateFinalPrice(game.price, game.discountPercent),
    }));
  }
  return staticGames;
}

// ===== То, чем пользуется витрина =====
export async function fetchGames(filters: CatalogFilters): Promise<Game[]> {
  if (USE_API) {
    return getJson<Game[]>(`${API_BASE}/games?${toQuery(filters)}`);
  }
  return selectGames(await loadStaticCatalog(), filters);
}

export async function fetchGame(id: number): Promise<GameDetails | undefined> {
  if (USE_API) {
    const response = await fetch(`${API_BASE}/games/${id}`);
    if (response.status === 404) {
      return undefined;
    }
    if (!response.ok) {
      throw new Error(`Сервер ответил ошибкой ${response.status}`);
    }
    return (await response.json()) as GameDetails;
  }
  return (await loadStaticCatalog()).find((game) => game.id === id);
}

export async function fetchGenres(): Promise<Genre[]> {
  if (USE_API) {
    const genres = await getJson<{ name: Genre; count: number }[]>(`${API_BASE}/genres`);
    return genres.map((genre) => genre.name);
  }
  return getGenres(await loadStaticCatalog());
}

// ===== Игроки, отзывы, заказы: только с сервером =====
export async function fetchPlayers(): Promise<Player[]> {
  return getJson<Player[]>(`${API_BASE}/players`);
}

export async function fetchReviews(gameId: number): Promise<Review[]> {
  return getJson<Review[]>(`${API_BASE}/games/${gameId}/reviews`);
}

export async function fetchLibrary(playerId: number): Promise<LibraryItem[]> {
  return getJson<LibraryItem[]>(`${API_BASE}/players/${playerId}/library`);
}

interface ProblemDetails {
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

// Результат запроса, который что-то меняет: успех с данными или ошибки для формы
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; errors: Record<string, string[]> };

async function sendJson<T>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return { ok: true, data: undefined as T }; // 204 No Content: успех без тела
  }
  if (response.ok) {
    return { ok: true, data: (await response.json()) as T };
  }
  if (response.status >= 400 && response.status < 500) {
    const problem = (await response.json()) as ProblemDetails;
    return { ok: false, message: problem.detail ?? problem.title, errors: problem.errors ?? {} };
  }
  throw new Error(`Сервер ответил ошибкой ${response.status}`);
}

export function postReview(gameId: number, input: NewReview): Promise<ApiResult<Review>> {
  return sendJson<Review>("POST", `${API_BASE}/games/${gameId}/reviews`, input);
}

export function postGame(input: GameInput): Promise<ApiResult<GameDetails>> {
  return sendJson<GameDetails>("POST", `${API_BASE}/games`, input);
}

export function putGame(id: number, input: GameInput): Promise<ApiResult<GameDetails>> {
  return sendJson<GameDetails>("PUT", `${API_BASE}/games/${id}`, input);
}

export function putDiscount(id: number, discountPercent: number): Promise<ApiResult<GameDetails>> {
  return sendJson<GameDetails>("PUT", `${API_BASE}/games/${id}/discount`, { discountPercent });
}

export function deleteGame(id: number): Promise<ApiResult<void>> {
  return sendJson<void>("DELETE", `${API_BASE}/games/${id}`);
}

export function postOrder(input: NewOrder): Promise<ApiResult<Order>> {
  return sendJson<Order>("POST", `${API_BASE}/orders`, input);
}
