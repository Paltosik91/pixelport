import type { Game } from "./models.js";

export function finalPrice(game: Game): number {
  return Math.floor((game.price * (100 - game.discountPercent)) / 100);
}

export function formatPrice(rubles: number): string {
  return `${rubles} ₽`;
}
