export function finalPrice(game) {
    return Math.floor((game.price * (100 - game.discountPercent)) / 100);
}
export function formatPrice(rubles) {
    return `${rubles} ₽`;
}
//# sourceMappingURL=price.js.map