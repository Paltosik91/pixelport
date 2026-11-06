import type { Review } from "./models.js";
import { fetchGame, fetchReviews, postReview } from "./api.js";
import { getCurrentPlayer } from "./player.js";
import { formatRatingLine } from "./game-page.js";
import { setText } from "./dom.js";

function createReviewItem(review: Review): HTMLLIElement {
  const item = document.createElement("li");
  item.className = review.isRecommended ? "review review-yes" : "review review-no";

  const avatar = document.createElement("img");
  avatar.src = review.avatarUrl;
  avatar.alt = "";
  avatar.width = 48;
  avatar.height = 48;

  const header = document.createElement("p");
  header.className = "review-header";
  const name = document.createElement("strong");
  name.textContent = review.player;
  const verdict = document.createElement("span");
  verdict.textContent = review.isRecommended ? "👍 Рекомендует" : "👎 Не рекомендует";
  const date = document.createElement("time");
  date.dateTime = review.createdAt;
  date.textContent = new Date(review.createdAt).toLocaleDateString("ru-RU");
  header.append(name, verdict, date);

  const text = document.createElement("p");
  text.textContent = review.text;

  const body = document.createElement("div");
  body.append(header, text);
  item.append(avatar, body);
  return item;
}

export async function setupReviews(gameId: number): Promise<void> {
  const list = document.querySelector<HTMLUListElement>("#review-list");
  const form = document.querySelector<HTMLFormElement>("#review-form");
  const textArea = document.querySelector<HTMLTextAreaElement>("#review-text");
  const submitButton = form?.querySelector<HTMLButtonElement>("button[type=submit]");
  if (list === null || form === null || textArea === null || submitButton == null) {
    return;
  }

  const reviews = await fetchReviews(gameId);
  list.replaceChildren(...reviews.map(createReviewItem));
  form.hidden = false;

  const showAuthor = (): void => {
    setText("#review-author", `Ты пишешь как ${getCurrentPlayer()?.nickname ?? "…"}`);
  };
  showAuthor();
  document.addEventListener("playerchange", showAuthor);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const player = getCurrentPlayer();
    if (player === undefined) {
      return;
    }

    setText("#review-text-error", "");
    setText("#review-message", "Отправляем…");
    submitButton.disabled = true; // второй клик не отправит отзыв второй раз

    try {
      const vote = new FormData(form).get("vote");
      const result = await postReview(gameId, {
        playerId: player.id,
        isRecommended: vote === "yes",
        text: textArea.value,
      });

      if (result.ok) {
        list.prepend(createReviewItem(result.review));
        textArea.value = "";
        setText("#review-message", "Спасибо! Отзыв опубликован.");
        const game = await fetchGame(gameId);
        if (game !== undefined) {
          setText("#game-rating", formatRatingLine(game));
        }
      } else {
        setText("#review-text-error", result.errors["text"]?.join(" ") ?? "");
        setText("#review-message", result.errors["text"] === undefined ? result.message : "");
      }
    } catch (error) {
      setText("#review-message", error instanceof Error ? error.message : "Не удалось отправить отзыв");
    } finally {
      submitButton.disabled = false;
    }
  });
}
