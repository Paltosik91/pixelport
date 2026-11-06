export function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element !== null) {
        element.textContent = text;
    }
}
//# sourceMappingURL=dom.js.map