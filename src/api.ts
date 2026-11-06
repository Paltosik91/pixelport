import type { Game } from "./models.js";

const CATALOG_URL = "data/catalog.json";

export async function loadGames(): Promise<Game[]> {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Сервер ответил ошибкой ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Каталог пришёл в неожиданном формате");
  }
  return data as Game[];
}
