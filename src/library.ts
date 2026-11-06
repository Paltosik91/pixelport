import type { LibraryItem } from "./models.js";
import { fetchLibrary } from "./api.js";
import { getCurrentPlayer } from "./player.js";
import { formatPrice } from "./price.js";
import { setText, useFallbackImage } from "./dom.js";

function createLibraryItem(item: LibraryItem): HTMLLIElement {
  const li = document.createElement("li");

  const cover = document.createElement("img");
  cover.src = `img/${item.slug}.png`;
  cover.alt = "";
  cover.width = 80;
  cover.height = 107;
  useFallbackImage(cover);

  const link = document.createElement("a");
  link.href = `game.html?id=${item.gameId}`;
  link.textContent = item.title;

  const date = new Date(item.purchasedAt).toLocaleDateString("ru-RU");
  li.append(cover, link, ` — куплено ${date} за ${formatPrice(item.price)}`);
  return li;
}

async function renderLibrary(): Promise<void> {
  const list = document.querySelector<HTMLUListElement>("#library-list");
  const empty = document.querySelector<HTMLElement>("#library-empty");
  const player = getCurrentPlayer();
  if (list === null || player === undefined) {
    return;
  }

  const items = await fetchLibrary(player.id);
  list.replaceChildren(...items.map(createLibraryItem));
  setText("#library-title", `Купленные игры: ${player.nickname} (${items.length})`);
  if (empty !== null) {
    empty.hidden = items.length > 0;
  }
}

export async function setupLibrary(): Promise<void> {
  if (document.querySelector("#library-list") === null) {
    return;
  }
  await renderLibrary();
  // Сменили игрока — показываем его библиотеку
  document.addEventListener("playerchange", renderLibrary);
}

export function showLibraryOffline(): void {
  const offline = document.querySelector<HTMLElement>("#library-offline");
  if (offline !== null) {
    offline.hidden = false;
  }
}
