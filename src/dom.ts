export function setText(selector: string, text: string): void {
  const element = document.querySelector(selector);
  if (element !== null) {
    element.textContent = text;
  }
}
