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
    if (filters.editorsChoice) {
        params.set("editorsChoice", "true");
    }
    params.set("sort", filters.sort);
    return params.toString();
}
// ===== Без сервера: весь каталог из файла, фильтры в браузере =====
let staticGames = null;
async function loadStaticCatalog() {
    if (staticGames === null) {
        const raw = await getJson(CATALOG_URL);
        staticGames = raw.map(({ editorsChoice, ...game }) => ({
            ...game,
            finalPrice: calculateFinalPrice(game.price, game.discountPercent),
            isEditorsChoice: editorsChoice ?? false,
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
// ===== Игроки, отзывы, заказы: только с сервером =====
export async function fetchPlayers() {
    return getJson(`${API_BASE}/players`);
}
export async function fetchReviews(gameId) {
    return getJson(`${API_BASE}/games/${gameId}/reviews`);
}
export async function fetchSimilar(gameId) {
    return getJson(`${API_BASE}/games/${gameId}/similar`);
}
export async function fetchStats() {
    return getJson(`${API_BASE}/stats`);
}
export async function fetchLibrary(playerId) {
    return getJson(`${API_BASE}/players/${playerId}/library`);
}
async function sendJson(method, url, body) {
    const response = await fetch(url, {
        method,
        headers: body === undefined ? {} : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) {
        return { ok: true, data: undefined }; // 204 No Content: успех без тела
    }
    if (response.ok) {
        return { ok: true, data: (await response.json()) };
    }
    if (response.status >= 400 && response.status < 500) {
        const problem = (await response.json());
        return { ok: false, message: problem.detail ?? problem.title, errors: problem.errors ?? {} };
    }
    throw new Error(`Сервер ответил ошибкой ${response.status}`);
}
export function postReview(gameId, input) {
    return sendJson("POST", `${API_BASE}/games/${gameId}/reviews`, input);
}
export function postGame(input) {
    return sendJson("POST", `${API_BASE}/games`, input);
}
export function putGame(id, input) {
    return sendJson("PUT", `${API_BASE}/games/${id}`, input);
}
export function putDiscount(id, discountPercent) {
    return sendJson("PUT", `${API_BASE}/games/${id}/discount`, { discountPercent });
}
export function deleteGame(id) {
    return sendJson("DELETE", `${API_BASE}/games/${id}`);
}
export function postOrder(input) {
    return sendJson("POST", `${API_BASE}/orders`, input);
}
//# sourceMappingURL=api.js.map