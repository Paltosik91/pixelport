import type { Game, Genre, Order } from "./models.js";
import { USE_API, fetchGame, fetchGames, fetchGenres, postOrder } from "./api.js";
import { getCurrentPlayer, setupPlayerSwitch } from "./player.js";
import { setupLibrary, showLibraryOffline } from "./library.js";
import { setupReviews } from "./reviews.js";
import { setupSimilar } from "./similar.js";
import { setupAdminForm, showAdminOffline } from "./admin.js";
import { createLoadError, createSkeletonCards } from "./loading.js";
import type { CatalogFilters, SortOrder } from "./filters.js";
import { createGameCard } from "./render.js";
import { getGameIdFromUrl, renderGamePage } from "./game-page.js";
import { loadIds, saveIds } from "./storage.js";
import { calculateTotals, createCartRow, getCartGames, getPromoPercent } from "./cart.js";
import { formatPrice } from "./price.js";
import { setText } from "./dom.js";
import { pickGameOfDay } from "./sale.js";
import { startSaleTimer } from "./sale-banner.js";

// ===== Состояние: каталог, корзина и желаемое =====
let games: Game[] = [];
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
const ALL_GAMES: CatalogFilters = { query: "", genre: "", maxPrice: null, onlySale: false, sort: "rating" };

async function fillGenres(): Promise<void> {
  if (genreSelect === null) {
    return;
  }
  const genres = await fetchGenres();
  genreSelect.length = 1; // оставить только «Все жанры», если это повторная попытка
  for (const genre of genres) {
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

async function renderCatalog(): Promise<void> {
  if (catalogGrid === null) {
    return;
  }

  const found = await fetchGames(readFilters());
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

async function updateCatalog(): Promise<void> {
  try {
    await renderCatalog();
  } catch (error) {
    showLoadError(error, updateCatalog);
  }
}

// Ждём, пока покупатель перестанет печатать, и только тогда спрашиваем сервер
let filterTimer: number | undefined;

function onFiltersChanged(): void {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(updateCatalog, 300);
}

function resetFilters(): void {
  filtersForm?.reset();
  updateCatalog();
}

filtersForm?.addEventListener("input", onFiltersChanged);
filtersForm?.addEventListener("submit", (event) => event.preventDefault());

for (const button of document.querySelectorAll<HTMLButtonElement>(".reset-filters")) {
  button.addEventListener("click", resetFilters);
}

// ===== Страница игры =====
const gamePage = document.querySelector<HTMLElement>("#game-page");
const gameNotFound = document.querySelector<HTMLElement>("#game-not-found");

async function renderGameSection(): Promise<void> {
  if (gamePage === null) {
    return;
  }
  const game = await fetchGame(getGameIdFromUrl());
  if (game === undefined) {
    gamePage.hidden = true;
    if (gameNotFound !== null) {
      gameNotFound.hidden = false;
    }
    document.title = "Игра не найдена — PixelPort";
  } else {
    renderGamePage(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) });
    if (USE_API) {
      await setupSimilar(game.id, (id) => ({ inCart: cart.has(id), wished: wishlist.has(id) }));
      await setupReviews(game.id);
    } else {
      const offline = document.querySelector<HTMLElement>("#reviews-offline");
      if (offline !== null) {
        offline.hidden = false;
      }
    }
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
const orderDone = document.querySelector<HTMLDivElement>("#order-done");

let promoPercent = 0;
let promoCode = "";

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
    promoCode = "";
    setText("#promo-message", "Такого промокода нет");
  } else {
    promoPercent = percent;
    promoCode = promoInput?.value.trim() ?? "";
    setText("#promo-message", `Промокод применён: скидка ${percent}%`);
  }
  renderCart();
});

function showOrderDone(order: Order): void {
  setText("#order-done-title", `Заказ №${order.id} оформлен`);
  setText(
    "#order-done-text",
    `${order.player}, игр в заказе: ${order.games.length}, оплачено ${formatPrice(order.total)}. Они уже в твоей библиотеке.`,
  );
  if (cartEmpty !== null) {
    cartEmpty.hidden = true;
  }
  if (orderDone !== null) {
    orderDone.hidden = false;
  }
}

async function checkout(): Promise<void> {
  const player = getCurrentPlayer();
  if (!USE_API || player === undefined) {
    setText("#checkout-message", "Заказы принимает сервер магазина: открой корзину на localhost:5080.");
    return;
  }

  // Отправляем только что купить. Сколько это стоит, сервер посчитает сам
  const gameIds = getCartGames(games, cart).map((game) => game.id);
  setText("#checkout-message", "Оформляем заказ…");
  if (checkoutButton !== null) {
    checkoutButton.disabled = true;
  }

  let result;
  try {
    result = await postOrder({ playerId: player.id, gameIds, promoCode });
  } catch (error) {
    setText("#checkout-message", error instanceof Error ? error.message : "Не удалось оформить заказ");
    return;
  } finally {
    if (checkoutButton !== null) {
      checkoutButton.disabled = false;
    }
  }

  if (!result.ok) {
    // 400 — ошибки по полям, 409 — объяснение в detail
    setText("#checkout-message", Object.values(result.errors).flat().join(" ") || result.message);
    return;
  }

  cart.clear();
  saveIds("cart", cart);
  updateCartCount();
  promoPercent = 0;
  promoCode = "";
  setText("#checkout-message", "");
  renderCart();
  showOrderDone(result.data);
}

checkoutButton?.addEventListener("click", checkout);

// ===== Распродажа и «Игра дня» =====
startSaleTimer();

const dealOfDay = document.querySelector<HTMLElement>("#deal-of-day");

function renderDealOfDay(): void {
  if (dealOfDay === null) {
    return;
  }
  const game = pickGameOfDay(games, new Date());
  const card = createGameCard(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) });

  const about = document.createElement("div");
  about.className = "deal-of-day-about";
  const title = document.createElement("h3");
  title.textContent = game.title;
  const description = document.createElement("p");
  description.textContent = game.description;
  const link = document.createElement("a");
  link.className = "button";
  link.href = `game.html?id=${game.id}`;
  link.textContent = "Подробнее об игре";
  about.append(title, description, link);

  dealOfDay.querySelector(".deal-of-day-content")?.replaceChildren(card, about);
  dealOfDay.hidden = false;
}

// ===== Библиотека: желаемое =====
const wishlistGrid = document.querySelector<HTMLDivElement>("#wishlist-grid");
const wishlistEmpty = document.querySelector<HTMLDivElement>("#wishlist-empty");

function renderWishlist(): void {
  if (wishlistGrid === null) {
    return;
  }
  const wishedGames = games.filter((game) => wishlist.has(game.id));
  wishlistGrid.replaceChildren(
    ...wishedGames.map((game) => createGameCard(game, { inCart: cart.has(game.id), wished: true })),
  );
  if (wishlistEmpty !== null) {
    wishlistEmpty.hidden = wishedGames.length > 0;
  }
}

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
    renderWishlist();
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

// ===== Запуск: загрузить каталог и нарисовать страницу =====
const pageMain = document.querySelector("main");

function showLoadError(error: unknown, onRetry: () => void): void {
  const message = error instanceof Error ? error.message : "Неизвестная ошибка";
  console.error("Каталог не загрузился:", error);
  catalogGrid?.replaceChildren();
  setText("#catalog-status", "");
  pageMain?.prepend(createLoadError(message, onRetry));
}

async function start(): Promise<void> {
  catalogGrid?.replaceChildren(...createSkeletonCards(8));
  setText("#catalog-status", "Загружаем каталог…");
  if (filtersForm !== null) {
    filtersForm.inert = true;
  }

  try {
    if (USE_API) {
      await setupPlayerSwitch();
      await setupAdminForm();
      await setupLibrary();
    } else {
      showAdminOffline();
      showLibraryOffline();
    }
    games = await fetchGames(ALL_GAMES);
    await fillGenres();
    await renderCatalog();
    await renderGameSection();
  } catch (error) {
    showLoadError(error, start);
    return;
  }

  if (filtersForm !== null) {
    filtersForm.inert = false;
  }
  renderDealOfDay();
  renderCart();
  renderWishlist();
}

updateCartCount();
start();
