import { createPrice } from "./render.js";
import { createSlider } from "./slider.js";
import { setText, useFallbackImage } from "./dom.js";
export function getGameIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("id"));
}
function createListItems(items) {
    return items.map((text) => {
        const item = document.createElement("li");
        item.textContent = text;
        return item;
    });
}
export function formatRatingLine(game) {
    if (game.rating === null) {
        return "Пока нет отзывов";
    }
    const count = game.reviewsCount === undefined ? "" : ` · отзывов: ${game.reviewsCount}`;
    return `${game.rating}% положительных${count}`;
}
export function renderGamePage(game, state) {
    document.title = `${game.title} — PixelPort`;
    setText("#game-title", game.title);
    setText("#game-description", game.description);
    setText("#game-genre", game.genre);
    setText("#game-year", String(game.year));
    setText("#game-developer", game.developer);
    setText("#game-rating", formatRatingLine(game));
    const choiceBadge = document.querySelector("#game-editors-choice");
    if (choiceBadge !== null) {
        choiceBadge.hidden = !game.isEditorsChoice;
    }
    const cover = document.querySelector("#game-cover");
    if (cover !== null) {
        useFallbackImage(cover);
        cover.src = `img/${game.slug}.png`;
        cover.alt = game.coverAlt;
    }
    const slider = createSlider([
        { src: `img/screens/${game.slug}-1.png`, alt: `${game.title}: скриншот 1` },
        { src: `img/screens/${game.slug}-2.png`, alt: `${game.title}: скриншот 2` },
    ]);
    document.querySelector("#game-slider")?.replaceChildren(slider);
    // Скриншотов нет (новая игра) — слайдер не нужен
    slider.querySelector("img")?.addEventListener("error", () => slider.remove(), { once: true });
    document.querySelector("#game-tags")?.replaceChildren(...createListItems(game.tags));
    const featuresSection = document.querySelector("#game-features");
    if (featuresSection !== null) {
        const features = game.features ?? [];
        featuresSection.hidden = features.length === 0;
        featuresSection.querySelector("ul")?.replaceChildren(...createListItems(features));
    }
    document.querySelector("#game-price")?.replaceChildren(createPrice(game));
    const buyButton = document.querySelector("#game-buy");
    if (buyButton !== null) {
        buyButton.dataset.gameId = String(game.id);
        buyButton.textContent = state.inCart ? "В корзине ✓" : "Купить";
        buyButton.disabled = state.inCart;
    }
    const wishButton = document.querySelector("#game-wish");
    if (wishButton !== null) {
        wishButton.dataset.gameId = String(game.id);
        wishButton.setAttribute("aria-pressed", String(state.wished));
        wishButton.setAttribute("aria-label", `В желаемое: ${game.title}`);
        wishButton.textContent = state.wished ? "♥" : "♡";
    }
}
//# sourceMappingURL=game-page.js.map