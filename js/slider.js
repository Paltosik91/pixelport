export function createSlider(slides) {
    const slider = document.createElement("div");
    slider.className = "slider";
    slider.tabIndex = 0;
    slider.setAttribute("role", "region");
    slider.setAttribute("aria-label", "Скриншоты игры. Листайте стрелками влево и вправо");
    const image = document.createElement("img");
    image.className = "slider-image";
    image.width = 1280;
    image.height = 720;
    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "slider-button slider-prev";
    prevButton.setAttribute("aria-label", "Предыдущий скриншот");
    prevButton.textContent = "‹";
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "slider-button slider-next";
    nextButton.setAttribute("aria-label", "Следующий скриншот");
    nextButton.textContent = "›";
    const counter = document.createElement("p");
    counter.className = "slider-counter";
    counter.setAttribute("aria-live", "polite");
    let current = 0;
    function show(index) {
        current = (index + slides.length) % slides.length;
        const slide = slides[current];
        image.src = slide.src;
        image.alt = slide.alt;
        counter.textContent = `${current + 1} / ${slides.length}`;
    }
    prevButton.addEventListener("click", () => show(current - 1));
    nextButton.addEventListener("click", () => show(current + 1));
    slider.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            show(current - 1);
        }
        else if (event.key === "ArrowRight") {
            show(current + 1);
        }
    });
    slider.append(image, prevButton, nextButton, counter);
    show(0);
    return slider;
}
//# sourceMappingURL=slider.js.map