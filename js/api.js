import { getGenres, selectGames } from "./filters.js";
import { calculateFinalPrice } from "./price.js";
// Наш сервер ASP.NET Core (порт 5080) отвечает на адреса /api/…,
// а GitHub Pages и Live Server умеют только раздавать файлы.
export const USE_API = window.location.port === "5080";
const API_BASE = "api";
const CATALOG_URL = "data/catalog.json";
async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Сервер ответил ошибкой ${response.status}`);
    }
    return (await response.json());
}
function toQuery(filters) {
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
let staticGames = null;
async function loadStaticCatalog() {
    if (staticGames === null) {
        const raw = await getJson(CATALOG_URL);
        staticGames = raw.map((game) => ({
            ...game,
            finalPrice: calculateFinalPrice(game.price, game.discountPercent),
        }));
    }
    return staticGames;
}
// ===== То, чем пользуется витрина =====
export async function fetchGames(filters) {
    if (USE_API) {
        return getJson(`${API_BASE}/games?${toQuery(filters)}`);
    }
    return selectGames(await loadStaticCatalog(), filters);
}
export async function fetchGame(id) {
    if (USE_API) {
        const response = await fetch(`${API_BASE}/games/${id}`);
        if (response.status === 404) {
            return undefined;
        }
        if (!response.ok) {
            throw new Error(`Сервер ответил ошибкой ${response.status}`);
        }
        return (await response.json());
    }
    return (await loadStaticCatalog()).find((game) => game.id === id);
}
export async function fetchGenres() {
    if (USE_API) {
        const genres = await getJson(`${API_BASE}/genres`);
        return genres.map((genre) => genre.name);
    }
    return getGenres(await loadStaticCatalog());
}
// ===== Игроки и отзывы: только с сервером =====
export async function fetchPlayers() {
    return getJson(`${API_BASE}/players`);
}
export async function fetchReviews(gameId) {
    return getJson(`${API_BASE}/games/${gameId}/reviews`);
}
export async function postReview(gameId, input) {
    const response = await fetch(`${API_BASE}/games/${gameId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (response.ok) {
        return { ok: true, review: (await response.json()) };
    }
    if (response.status >= 400 && response.status < 500) {
        const problem = (await response.json());
        return { ok: false, message: problem.detail ?? problem.title, errors: problem.errors ?? {} };
    }
    throw new Error(`Сервер ответил ошибкой ${response.status}`);
}
//# sourceMappingURL=api.js.map