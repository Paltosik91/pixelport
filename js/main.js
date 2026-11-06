import { games } from "./data.js";
import { createGameCard } from "./render.js";
// ===== Витрина из данных =====
const catalogGrid = document.querySelector("#catalog-grid");
const catalogTitle = document.querySelector("#catalog-title");
if (catalogGrid !== null) {
    for (const game of games) {
        catalogGrid.append(createGameCard(game));
    }
}
if (catalogTitle !== null) {
    catalogTitle.textContent = `Все игры (${games.length})`;
}
// ===== Счётчик корзины в шапке =====
const cartCount = document.querySelector("#cart-count");
let itemsInCart = 0;
function updateCartCount() {
    if (cartCount !== null) {
        cartCount.textContent = String(itemsInCart);
    }
}
function addToCart(title) {
    itemsInCart += 1;
    updateCartCount();
    console.log(`В корзину добавлена игра «${title}». Всего: ${itemsInCart}`);
}
// ===== Кнопки «В корзину» =====
const buyButtons = document.querySelectorAll(".buy-button");
for (const button of buyButtons) {
    button.addEventListener("click", () => {
        const title = button.dataset.title ?? "Без названия";
        addToCart(title);
        button.textContent = "В корзине ✓";
        button.disabled = true;
    });
}
// ===== Кнопки «В желаемое» =====
const wishButtons = document.querySelectorAll(".wish-button");
for (const button of wishButtons) {
    button.addEventListener("click", () => {
        const isWished = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!isWished));
        button.textContent = isWished ? "♡" : "♥";
    });
}
updateCartCount();
//# sourceMappingURL=main.js.map