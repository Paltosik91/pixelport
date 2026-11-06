import { formatPrice } from "./price.js";
import { useFallbackImage } from "./dom.js";
export function createPrice(game) {
    const price = document.createElement("p");
    price.className = "price";
    if (game.discountPercent > 0) {
        const oldPrice = document.createElement("del");
        oldPrice.textContent = formatPrice(game.price);
        price.append(oldPrice);
    }
    const currentPrice = document.createElement("strong");
    currentPrice.textContent = formatPrice(game.finalPrice);
    price.append(currentPrice);
    if (game.discountPercent > 0) {
        const discount = document.createElement("mark");
        discount.textContent = `−${game.discountPercent}%`;
        price.append(discount);
    }
    return price;
}
// Оценка словами, как в больших магазинах
export function describeRating(rating) {
    if (rating === null) {
        return "Пока нет отзывов";
    }
    if (rating >= 80) {
        return `👍 ${rating}% · очень положительные`;
    }
    if (rating >= 60) {
        return `👍 ${rating}% · в основном положительные`;
    }
    if (rating >= 40) {
        return `${rating}% · смешанные`;
    }
    return `👎 ${rating}% · в основном отрицательные`;
}
// Новинки — игры этого года выпуска и новее
const NEW_RELEASE_YEAR = 2025;
export function isNewRelease(game) {
    return game.year >= NEW_RELEASE_YEAR;
}
export function createGameCard(game, state) {
    const card = document.createElement("article");
    card.className = "card";
    if (game.discountPercent > 0) {
        card.dataset.discount = `−${game.discountPercent}%`;
    }
    const wishButton = document.createElement("button");
    wishButton.type = "button";
    wishButton.className = "wish-button";
    wishButton.dataset.gameId = String(game.id);
    wishButton.setAttribute("aria-pressed", String(state.wished));
    wishButton.setAttribute("aria-label", `В желаемое: ${game.title}`);
    wishButton.textContent = state.wished ? "♥" : "♡";
    const link = document.createElement("a");
    link.href = `game.html?id=${game.id}`;
    const cover = document.createElement("img");
    cover.src = `img/${game.slug}.png`;
    cover.alt = game.coverAlt;
    cover.width = 180;
    cover.height = 240;
    cover.loading = "lazy";
    useFallbackImage(cover);
    // Обложка в обёртке: на неё ложится бейдж «Выбор редакции»
    const coverBox = document.createElement("span");
    coverBox.className = "cover-box";
    coverBox.append(cover);
    if (game.isEditorsChoice) {
        const badge = document.createElement("span");
        badge.className = "editors-badge";
        badge.textContent = "★ Выбор редакции";
        coverBox.append(badge);
    }
    const title = document.createElement("h3");
    title.textContent = game.title;
    link.append(coverBox, title);
    const meta = document.createElement("p");
    const newMark = isNewRelease(game) ? " · 🆕 новинка" : "";
    meta.textContent = `${game.genre} · ${game.year}${newMark}`;
    const rating = document.createElement("p");
    rating.className = "card-rating";
    rating.textContent = describeRating(game.rating);
    const buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.className = "buy-button";
    buyButton.dataset.gameId = String(game.id);
    buyButton.textContent = state.inCart ? "В корзине ✓" : "В корзину";
    buyButton.disabled = state.inCart;
    card.append(wishButton, link, meta, rating, createPrice(game), buyButton);
    return card;
}
//# sourceMappingURL=render.js.map