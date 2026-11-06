import { games } from "./data.js";
import type { Genre } from "./models.js";
import { getGenres, selectGames, type CatalogFilters, type SortOrder } from "./filters.js";
import { createGameCard } from "./render.js";
import { findGameFromUrl, renderGamePage } from "./game-page.js";
import { loadIds, saveIds } from "./storage.js";
import { calculateTotals, createCartRow, getCartGames, getPromoPercent } from "./cart.js";
import { formatPrice } from "./price.js";
import { setText } from "./dom.js";

// ===== Состояние: корзина и желаемое =====
const cart = loadIds("cart");
const wishlist = loadIds("wishlist");

const cartCount = document.querySelector<HTMLSpanElement>("#cart-count");

function updateCartCount(): void {
  if (cartCount !== null) {
    cartCount.textContent = String(cart.size);
  }
}

// ===== Элементы витрины =====
const catalogGrid = document.querySelector<HTMLDivElement>("#catalog-grid");
const catalogTitle = document.querySelector<HTMLHeadingElement>("#catalog-title");
const catalogStatus = document.querySelector<HTMLParagraphElement>("#catalog-status");
const emptyState = document.querySelector<HTMLDivElement>("#empty-state");

const filtersForm = document.querySelector<HTMLFormElement>("#filters");
const searchInput = document.querySelector<HTMLInputElement>("#search");
const genreSelect = document.querySelector<HTMLSelectElement>("#genre");
const priceSelect = document.querySelector<HTMLSelectElement>("#max-price");
const sortSelect = document.querySelector<HTMLSelectElement>("#sort");
const saleCheckbox = document.querySelector<HTMLInputElement>("#only-sale");

// ===== Фильтры =====
function fillGenres(): void {
  if (genreSelect === null) {
    return;
  }
  for (const genre of getGenres(games)) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreSelect.append(option);
  }
}

function readFilters(): CatalogFilters {
  const maxPrice = priceSelect?.value ?? "";
  return {
    query: searchInput?.value ?? "",
    genre: (genreSelect?.value ?? "") as Genre | "",
    maxPrice: maxPrice === "" ? null : Number(maxPrice),
    onlySale: saleCheckbox?.checked ?? false,
    sort: (sortSelect?.value ?? "rating") as SortOrder,
  };
}

function renderCatalog(): void {
  if (catalogGrid === null) {
    return;
  }

  const found = selectGames(games, readFilters());
  const cards = found.map((game) =>
    createGameCard(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) }),
  );
  catalogGrid.replaceChildren(...cards);

  if (catalogTitle !== null) {
    catalogTitle.textContent = `Все игры (${games.length})`;
  }
  if (catalogStatus !== null) {
    catalogStatus.textContent = `Найдено: ${found.length} из ${games.length}`;
  }
  if (emptyState !== null) {
    emptyState.hidden = found.length > 0;
  }
}

function resetFilters(): void {
  filtersForm?.reset();
  renderCatalog();
}

filtersForm?.addEventListener("input", renderCatalog);
filtersForm?.addEventListener("submit", (event) => event.preventDefault());

for (const button of document.querySelectorAll<HTMLButtonElement>(".reset-filters")) {
  button.addEventListener("click", resetFilters);
}

// ===== Страница игры =====
const gamePage = document.querySelector<HTMLElement>("#game-page");
const gameNotFound = document.querySelector<HTMLElement>("#game-not-found");

if (gamePage !== null) {
  const game = findGameFromUrl(games);
  if (game === undefined) {
    gamePage.hidden = true;
    if (gameNotFound !== null) {
      gameNotFound.hidden = false;
    }
    document.title = "Игра не найдена — PixelPort";
  } else {
    renderGamePage(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) });
  }
}

// ===== Страница корзины =====
const cartItems = document.querySelector<HTMLTableSectionElement>("#cart-items");
const cartContent = document.querySelector<HTMLDivElement>("#cart-content");
const cartEmpty = document.querySelector<HTMLDivElement>("#cart-empty");
const discountRow = document.querySelector<HTMLTableRowElement>("#cart-discount-row");
const promoForm = document.querySelector<HTMLFormElement>("#promo-form");
const promoInput = document.querySelector<HTMLInputElement>("#promo");
const checkoutButton = document.querySelector<HTMLButtonElement>("#checkout");

let promoPercent = 0;

function renderCart(): void {
  if (cartItems === null) {
    return;
  }

  const cartGames = getCartGames(games, cart);
  cartItems.replaceChildren(...cartGames.map(createCartRow));

  const totals = calculateTotals(cartGames, promoPercent);
  setText("#cart-subtotal", formatPrice(totals.subtotal));
  setText("#cart-discount", `−${formatPrice(totals.discount)} (−${promoPercent}%)`);
  setText("#cart-total", formatPrice(totals.total));

  if (discountRow !== null) {
    discountRow.hidden = promoPercent === 0;
  }
  if (cartContent !== null) {
    cartContent.hidden = cartGames.length === 0;
  }
  if (cartEmpty !== null) {
    cartEmpty.hidden = cartGames.length > 0;
  }
}

promoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const percent = getPromoPercent(promoInput?.value ?? "");
  if (percent === undefined) {
    promoPercent = 0;
    setText("#promo-message", "Такого промокода нет");
  } else {
    promoPercent = percent;
    setText("#promo-message", `Промокод применён: скидка ${percent}%`);
  }
  renderCart();
});

checkoutButton?.addEventListener("click", () => {
  setText("#checkout-message", "Оплата появится, когда у магазина будет свой сервер. Скоро!");
});

// ===== Кнопки: один обработчик на всю страницу =====
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const buyButton = event.target.closest<HTMLButtonElement>(".buy-button");
  if (buyButton !== null) {
    cart.add(Number(buyButton.dataset.gameId));
    saveIds("cart", cart);
    updateCartCount();
    buyButton.textContent = "В корзине ✓";
    buyButton.disabled = true;
    return;
  }

  const wishButton = event.target.closest<HTMLButtonElement>(".wish-button");
  if (wishButton !== null) {
    const id = Number(wishButton.dataset.gameId);
    if (wishlist.has(id)) {
      wishlist.delete(id);
    } else {
      wishlist.add(id);
    }
    saveIds("wishlist", wishlist);
    const isWished = wishlist.has(id);
    wishButton.setAttribute("aria-pressed", String(isWished));
    wishButton.textContent = isWished ? "♥" : "♡";
    return;
  }

  const removeButton = event.target.closest<HTMLButtonElement>(".remove-button");
  if (removeButton !== null) {
    cart.delete(Number(removeButton.dataset.gameId));
    saveIds("cart", cart);
    updateCartCount();
    renderCart();
  }
});

fillGenres();
renderCatalog();
renderCart();
updateCartCount();
