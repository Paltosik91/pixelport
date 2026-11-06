import { USE_API, fetchGame, fetchGames, fetchGenres } from "./api.js";
import { setupPlayerSwitch } from "./player.js";
import { setupReviews } from "./reviews.js";
import { createLoadError, createSkeletonCards } from "./loading.js";
import { createGameCard } from "./render.js";
import { getGameIdFromUrl, renderGamePage } from "./game-page.js";
import { loadIds, saveIds } from "./storage.js";
import { calculateTotals, createCartRow, getCartGames, getPromoPercent } from "./cart.js";
import { formatPrice } from "./price.js";
import { setText } from "./dom.js";
import { pickGameOfDay } from "./sale.js";
import { startSaleTimer } from "./sale-banner.js";
// ===== Состояние: каталог, корзина и желаемое =====
let games = [];
const cart = loadIds("cart");
const wishlist = loadIds("wishlist");
const cartCount = document.querySelector("#cart-count");
function updateCartCount() {
    if (cartCount !== null) {
        cartCount.textContent = String(cart.size);
    }
}
// ===== Элементы витрины =====
const catalogGrid = document.querySelector("#catalog-grid");
const catalogTitle = document.querySelector("#catalog-title");
const catalogStatus = document.querySelector("#catalog-status");
const emptyState = document.querySelector("#empty-state");
const filtersForm = document.querySelector("#filters");
const searchInput = document.querySelector("#search");
const genreSelect = document.querySelector("#genre");
const priceSelect = document.querySelector("#max-price");
const sortSelect = document.querySelector("#sort");
const saleCheckbox = document.querySelector("#only-sale");
// ===== Фильтры =====
const ALL_GAMES = { query: "", genre: "", maxPrice: null, onlySale: false, sort: "rating" };
async function fillGenres() {
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
function readFilters() {
    const maxPrice = priceSelect?.value ?? "";
    return {
        query: searchInput?.value ?? "",
        genre: (genreSelect?.value ?? ""),
        maxPrice: maxPrice === "" ? null : Number(maxPrice),
        onlySale: saleCheckbox?.checked ?? false,
        sort: (sortSelect?.value ?? "rating"),
    };
}
async function renderCatalog() {
    if (catalogGrid === null) {
        return;
    }
    const found = await fetchGames(readFilters());
    const cards = found.map((game) => createGameCard(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) }));
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
async function updateCatalog() {
    try {
        await renderCatalog();
    }
    catch (error) {
        showLoadError(error, updateCatalog);
    }
}
// Ждём, пока покупатель перестанет печатать, и только тогда спрашиваем сервер
let filterTimer;
function onFiltersChanged() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(updateCatalog, 300);
}
function resetFilters() {
    filtersForm?.reset();
    updateCatalog();
}
filtersForm?.addEventListener("input", onFiltersChanged);
filtersForm?.addEventListener("submit", (event) => event.preventDefault());
for (const button of document.querySelectorAll(".reset-filters")) {
    button.addEventListener("click", resetFilters);
}
// ===== Страница игры =====
const gamePage = document.querySelector("#game-page");
const gameNotFound = document.querySelector("#game-not-found");
async function renderGameSection() {
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
    }
    else {
        renderGamePage(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) });
        if (USE_API) {
            await setupReviews(game.id);
        }
        else {
            const offline = document.querySelector("#reviews-offline");
            if (offline !== null) {
                offline.hidden = false;
            }
        }
    }
}
// ===== Страница корзины =====
const cartItems = document.querySelector("#cart-items");
const cartContent = document.querySelector("#cart-content");
const cartEmpty = document.querySelector("#cart-empty");
const discountRow = document.querySelector("#cart-discount-row");
const promoForm = document.querySelector("#promo-form");
const promoInput = document.querySelector("#promo");
const checkoutButton = document.querySelector("#checkout");
let promoPercent = 0;
function renderCart() {
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
    }
    else {
        promoPercent = percent;
        setText("#promo-message", `Промокод применён: скидка ${percent}%`);
    }
    renderCart();
});
checkoutButton?.addEventListener("click", () => {
    setText("#checkout-message", "Оплата появится, когда у магазина будет свой сервер. Скоро!");
});
// ===== Распродажа и «Игра дня» =====
startSaleTimer();
const dealOfDay = document.querySelector("#deal-of-day");
function renderDealOfDay() {
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
const wishlistGrid = document.querySelector("#wishlist-grid");
const wishlistEmpty = document.querySelector("#wishlist-empty");
function renderWishlist() {
    if (wishlistGrid === null) {
        return;
    }
    const wishedGames = games.filter((game) => wishlist.has(game.id));
    wishlistGrid.replaceChildren(...wishedGames.map((game) => createGameCard(game, { inCart: cart.has(game.id), wished: true })));
    if (wishlistEmpty !== null) {
        wishlistEmpty.hidden = wishedGames.length > 0;
    }
}
// ===== Кнопки: один обработчик на всю страницу =====
document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }
    const buyButton = event.target.closest(".buy-button");
    if (buyButton !== null) {
        cart.add(Number(buyButton.dataset.gameId));
        saveIds("cart", cart);
        updateCartCount();
        buyButton.textContent = "В корзине ✓";
        buyButton.disabled = true;
        return;
    }
    const wishButton = event.target.closest(".wish-button");
    if (wishButton !== null) {
        const id = Number(wishButton.dataset.gameId);
        if (wishlist.has(id)) {
            wishlist.delete(id);
        }
        else {
            wishlist.add(id);
        }
        saveIds("wishlist", wishlist);
        renderWishlist();
        const isWished = wishlist.has(id);
        wishButton.setAttribute("aria-pressed", String(isWished));
        wishButton.textContent = isWished ? "♥" : "♡";
        return;
    }
    const removeButton = event.target.closest(".remove-button");
    if (removeButton !== null) {
        cart.delete(Number(removeButton.dataset.gameId));
        saveIds("cart", cart);
        updateCartCount();
        renderCart();
    }
});
// ===== Запуск: загрузить каталог и нарисовать страницу =====
const pageMain = document.querySelector("main");
function showLoadError(error, onRetry) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Каталог не загрузился:", error);
    catalogGrid?.replaceChildren();
    setText("#catalog-status", "");
    pageMain?.prepend(createLoadError(message, onRetry));
}
async function start() {
    catalogGrid?.replaceChildren(...createSkeletonCards(8));
    setText("#catalog-status", "Загружаем каталог…");
    if (filtersForm !== null) {
        filtersForm.inert = true;
    }
    try {
        if (USE_API) {
            await setupPlayerSwitch();
        }
        games = await fetchGames(ALL_GAMES);
        await fillGenres();
        await renderCatalog();
        await renderGameSection();
    }
    catch (error) {
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
//# sourceMappingURL=main.js.map