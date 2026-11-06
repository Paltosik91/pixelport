import type { Game } from "./models.js";
import { createPrice, type CardState } from "./render.js";
import { createSlider } from "./slider.js";
import { setText } from "./dom.js";

export function findGameFromUrl(allGames: Game[]): Game | undefined {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  return allGames.find((game) => game.id === id);
}

function createListItems(items: string[]): HTMLLIElement[] {
  return items.map((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  });
}

export function renderGamePage(game: Game, state: CardState): void {
  document.title = `${game.title} — PixelPort`;

  setText("#game-title", game.title);
  setText("#game-description", game.description);
  setText("#game-genre", game.genre);
  setText("#game-year", String(game.year));
  setText("#game-developer", game.developer);
  setText("#game-rating", `${game.rating}% положительных`);

  const cover = document.querySelector<HTMLImageElement>("#game-cover");
  if (cover !== null) {
    cover.src = `img/${game.slug}.png`;
    cover.alt = game.coverAlt;
  }

  const slider = createSlider([
    { src: `img/screens/${game.slug}-1.png`, alt: `${game.title}: скриншот 1` },
    { src: `img/screens/${game.slug}-2.png`, alt: `${game.title}: скриншот 2` },
  ]);
  document.querySelector("#game-slider")?.replaceChildren(slider);

  document.querySelector("#game-tags")?.replaceChildren(...createListItems(game.tags));

  const featuresSection = document.querySelector<HTMLElement>("#game-features");
  if (featuresSection !== null) {
    if (game.features === undefined) {
      featuresSection.hidden = true;
    } else {
      featuresSection.querySelector("ul")?.replaceChildren(...createListItems(game.features));
    }
  }

  document.querySelector("#game-price")?.replaceChildren(createPrice(game));

  const buyButton = document.querySelector<HTMLButtonElement>("#game-buy");
  if (buyButton !== null) {
    buyButton.dataset.gameId = String(game.id);
    buyButton.textContent = state.inCart ? "В корзине ✓" : "Купить";
    buyButton.disabled = state.inCart;
  }

  const wishButton = document.querySelector<HTMLButtonElement>("#game-wish");
  if (wishButton !== null) {
    wishButton.dataset.gameId = String(game.id);
    wishButton.setAttribute("aria-pressed", String(state.wished));
    wishButton.setAttribute("aria-label", `В желаемое: ${game.title}`);
    wishButton.textContent = state.wished ? "♥" : "♡";
  }
}
