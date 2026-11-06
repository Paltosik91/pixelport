function createBlock(className: string): HTMLDivElement {
  const block = document.createElement("div");
  block.className = className;
  return block;
}

export function createSkeletonCards(count: number): HTMLDivElement[] {
  const cards: HTMLDivElement[] = [];
  for (let i = 0; i < count; i++) {
    const card = createBlock("card card-skeleton");
    card.setAttribute("aria-hidden", "true");
    card.append(
      createBlock("skeleton skeleton-cover"),
      createBlock("skeleton skeleton-line"),
      createBlock("skeleton skeleton-line skeleton-short"),
      createBlock("skeleton skeleton-button"),
    );
    cards.push(card);
  }
  return cards;
}

export function createLoadError(message: string, onRetry: () => void): HTMLDivElement {
  const box = createBlock("empty-state load-error");
  box.setAttribute("role", "alert");

  const image = document.createElement("img");
  image.src = "img/states/load-error.png";
  image.alt = "";
  image.width = 240;
  image.height = 240;

  const title = document.createElement("h2");
  title.textContent = "Не удалось загрузить каталог";

  const hint = document.createElement("p");
  hint.textContent = "Проверь подключение к интернету и попробуй ещё раз.";

  const details = document.createElement("p");
  details.className = "load-error-details";
  details.textContent = message;

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "Повторить";
  retryButton.addEventListener("click", () => {
    box.remove();
    onRetry();
  });

  box.append(image, title, hint, details, retryButton);
  return box;
}
