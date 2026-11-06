import { finalPrice, formatPrice } from "./price.js";
function createPrice(game) {
    const price = document.createElement("p");
    price.className = "price";
    if (game.discountPercent > 0) {
        const oldPrice = document.createElement("del");
        oldPrice.textContent = formatPrice(game.price);
        price.append(oldPrice);
    }
    const currentPrice = document.createElement("strong");
    currentPrice.textContent = formatPrice(finalPrice(game));
    price.append(currentPrice);
    return price;
}
export function createGameCard(game) {
    const card = document.createElement("article");
    card.className = "card";
    if (game.discountPercent > 0) {
        card.dataset.discount = `−${game.discountPercent}%`;
    }
    const wishButton = document.createElement("button");
    wishButton.type = "button";
    wishButton.className = "wish-button";
    wishButton.setAttribute("aria-pressed", "false");
    wishButton.setAttribute("aria-label", `В желаемое: ${game.title}`);
    wishButton.textContent = "♡";
    const link = document.createElement("a");
    link.href = "game.html";
    const cover = document.createElement("img");
    cover.src = `img/${game.slug}.png`;
    cover.alt = game.coverAlt;
    cover.width = 180;
    cover.height = 240;
    cover.loading = "lazy";
    const title = document.createElement("h3");
    title.textContent = game.title;
    link.append(cover, title);
    const meta = document.createElement("p");
    meta.textContent = `${game.genre} · ${game.year} · 👍 ${game.rating}%`;
    const buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.className = "buy-button";
    buyButton.dataset.title = game.title;
    buyButton.textContent = "В корзину";
    card.append(wishButton, link, meta, createPrice(game), buyButton);
    return card;
}
//# sourceMappingURL=render.js.map