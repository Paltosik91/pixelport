export function calculateFinalPrice(price: number, discountPercent: number): number {
  return Math.floor((price * (100 - discountPercent)) / 100);
}

export function formatPrice(rubles: number): string {
  return `${rubles} ₽`;
}
