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
export {};
//# sourceMappingURL=main.js.map