import { games } from "./data.js";
import { getGenres, selectGames } from "./filters.js";
import { createGameCard } from "./render.js";
import { findGameFromUrl, renderGamePage } from "./game-page.js";
// ===== Состояние: корзина и желаемое =====
const cart = new Set();
const wishlist = new Set();
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
function fillGenres() {
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
function renderCatalog() {
    if (catalogGrid === null) {
        return;
    }
    const found = selectGames(games, readFilters());
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
function resetFilters() {
    filtersForm?.reset();
    renderCatalog();
}
filtersForm?.addEventListener("input", renderCatalog);
filtersForm?.addEventListener("submit", (event) => event.preventDefault());
for (const button of document.querySelectorAll(".reset-filters")) {
    button.addEventListener("click", resetFilters);
}
// ===== Страница игры =====
const gamePage = document.querySelector("#game-page");
const gameNotFound = document.querySelector("#game-not-found");
if (gamePage !== null) {
    const game = findGameFromUrl(games);
    if (game === undefined) {
        gamePage.hidden = true;
        if (gameNotFound !== null) {
            gameNotFound.hidden = false;
        }
        document.title = "Игра не найдена — PixelPort";
    }
    else {
        renderGamePage(game, { inCart: cart.has(game.id), wished: wishlist.has(game.id) });
    }
}
// ===== Кнопки карточек: один обработчик на всю страницу =====
document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }
    const buyButton = event.target.closest(".buy-button");
    if (buyButton !== null) {
        cart.add(Number(buyButton.dataset.gameId));
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
        const isWished = wishlist.has(id);
        wishButton.setAttribute("aria-pressed", String(isWished));
        wishButton.textContent = isWished ? "♥" : "♡";
    }
});
fillGenres();
renderCatalog();
updateCartCount();
//# sourceMappingURL=main.js.map