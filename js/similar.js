import { fetchSimilar } from "./api.js";
import { createGameCard } from "./render.js";
function createSimilarCard(item, state) {
    const card = createGameCard(item.game, state);
    // Почему игра здесь: общие теги — над ценой
    const common = document.createElement("p");
    common.className = "common-tags";
    common.textContent = `Общее: ${item.commonTags.join(", ")}`;
    card.insertBefore(common, card.querySelector(".price"));
    return card;
}
export async function setupSimilar(gameId, getState) {
    const section = document.querySelector("#similar");
    const grid = document.querySelector("#similar-games");
    if (section === null || grid === null) {
        return;
    }
    const similar = await fetchSimilar(gameId);
    grid.replaceChildren(...similar.map((item) => createSimilarCard(item, getState(item.game.id))));
    // Похожих нет (например, у новой игры без тегов) — блок не показываем
    section.hidden = similar.length === 0;
}
//# sourceMappingURL=similar.js.map