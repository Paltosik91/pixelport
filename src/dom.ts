export function setText(selector: string, text: string): void {
  const element = document.querySelector(selector);
  if (element !== null) {
    element.textContent = text;
  }
}

// Нет картинки (например, у новой игры ещё нет обложки) — показать заглушку
export function useFallbackImage(image: HTMLImageElement, fallback = "img/no-cover.png"): void {
  image.addEventListener(
    "error",
    () => {
      image.src = fallback;
    },
    { once: true },
  );
}
