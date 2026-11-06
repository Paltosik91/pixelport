export function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element !== null) {
        element.textContent = text;
    }
}
// Нет картинки (например, у новой игры ещё нет обложки) — показать заглушку
export function useFallbackImage(image, fallback = "img/no-cover.png") {
    image.addEventListener("error", () => {
        image.src = fallback;
    }, { once: true });
}
//# sourceMappingURL=dom.js.map