import type { Game } from "./models.js";
import { formatPrice } from "./price.js";

const PROMO_CODES: Record<string, number> = {
  PIXEL10: 10,
  WINTER25: 25,
};

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export function getPromoPercent(code: string): number | undefined {
  return PROMO_CODES[code.trim().toUpperCase()];
}

export function getCartGames(allGames: Game[], cart: Set<number>): Game[] {
  return allGames.filter((game) => cart.has(game.id));
}

export function calculateTotals(cartGames: Game[], promoPercent: number): CartTotals {
  const subtotal = cartGames.reduce((sum, game) => sum + game.finalPrice, 0);
  const discount = Math.floor((subtotal * promoPercent) / 100);
  return { subtotal, discount, total: subtotal - discount };
}

export function createCartRow(game: Game): HTMLTableRowElement {
  const row = document.createElement("tr");

  const gameCell = document.createElement("td");
  const cover = document.createElement("img");
  cover.src = `img/${game.slug}.png`;
  cover.alt = "";
  cover.width = 60;
  cover.height = 80;
  const link = document.createElement("a");
  link.href = `game.html?id=${game.id}`;
  link.textContent = game.title;
  gameCell.append(cover, link);

  const priceCell = document.createElement("td");
  priceCell.textContent = formatPrice(game.finalPrice);

  const actionCell = document.createElement("td");
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "button-secondary remove-button";
  removeButton.dataset.gameId = String(game.id);
  removeButton.setAttribute("aria-label", `Удалить из корзины: ${game.title}`);
  removeButton.textContent = "Удалить";
  actionCell.append(removeButton);

  row.append(gameCell, priceCell, actionCell);
  return row;
}
