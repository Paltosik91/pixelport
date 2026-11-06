import type { GameDetails, NewGame } from "./models.js";
import { fetchGenres, postGame, type PostResult } from "./api.js";
import { setText } from "./dom.js";

function readNewGame(form: HTMLFormElement): NewGame {
  const data = new FormData(form);
  const text = (name: string): string => String(data.get(name) ?? "");
  return {
    title: text("title"),
    slug: text("slug"),
    genre: text("genre"),
    developer: text("developer"),
    releaseYear: Number(text("releaseYear")),
    price: Number(text("price")),
    discountPercent: Number(text("discountPercent")),
    description: text("description"),
  };
}

// Ошибки сервера приходят по именам полей — показываем каждую у своего поля
function showErrors(form: HTMLFormElement, errors: Record<string, string[]>): void {
  for (const field of form.querySelectorAll<HTMLInputElement>("[name]")) {
    const messages = errors[field.name];
    field.setAttribute("aria-invalid", String(messages !== undefined));
    setText(`#error-${field.name}`, messages?.join(" ") ?? "");
  }
  const firstWrong = form.querySelector<HTMLElement>("[aria-invalid=true]");
  firstWrong?.focus();
}

export async function setupAdminForm(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>("#new-game-form");
  const fields = document.querySelector<HTMLFieldSetElement>("#new-game-fields");
  const genreSelect = document.querySelector<HTMLSelectElement>("#new-genre");
  if (form === null || fields === null || genreSelect === null) {
    return;
  }

  for (const genre of await fetchGenres()) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreSelect.append(option);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showErrors(form, {});
    const input = readNewGame(form); // до блокировки: поля disabled в FormData не попадают
    setText("#new-game-message", "Сохраняем…");
    fields.disabled = true; // пока ждём ответ — ни править, ни отправить второй раз

    let result: PostResult<GameDetails>;
    try {
      result = await postGame(input);
    } catch (error) {
      setText("#new-game-message", error instanceof Error ? error.message : "Не удалось сохранить игру");
      return;
    } finally {
      fields.disabled = false;
    }

    if (result.ok) {
      form.reset();
      const link = document.createElement("a");
      link.href = `game.html?id=${result.data.id}`;
      link.textContent = result.data.title;
      document.querySelector("#new-game-message")?.replaceChildren("Игра добавлена: ", link);
    } else {
      showErrors(form, result.errors);
      setText("#new-game-message", "Исправь ошибки в форме.");
    }
  });
}

export function showAdminOffline(): void {
  const form = document.querySelector<HTMLFormElement>("#new-game-form");
  const note = document.querySelector<HTMLElement>("#admin-offline");
  if (form !== null && note !== null) {
    form.hidden = true;
    note.hidden = false;
  }
}
