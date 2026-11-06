export function calculateFinalPrice(price, discountPercent) {
    return Math.floor((price * (100 - discountPercent)) / 100);
}
export function formatPrice(rubles) {
    return `${rubles} ₽`;
}
//# sourceMappingURL=price.js.map