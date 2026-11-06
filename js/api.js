const CATALOG_URL = "data/catalog.json";
export async function loadGames() {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) {
        throw new Error(`Сервер ответил ошибкой ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error("Каталог пришёл в неожиданном формате");
    }
    return data;
}
//# sourceMappingURL=api.js.map