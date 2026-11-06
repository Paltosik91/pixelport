import { deleteGame, fetchGame, fetchGames, fetchGenres, postGame, putDiscount, putGame } from "./api.js";
import { formatPrice } from "./price.js";
import { setText } from "./dom.js";
const ALL_GAMES = { query: "", genre: "", maxPrice: null, onlySale: false, editorsChoice: false, sort: "new" };
// Какую игру сейчас правим в форме; null — добавляем новую
let editingId = null;
function readGameInput(form) {
    const data = new FormData(form);
    const text = (name) => String(data.get(name) ?? "");
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
function showErrors(form, errors) {
    for (const field of form.querySelectorAll("[name]")) {
        const messages = errors[field.name];
        field.setAttribute("aria-invalid", String(messages !== undefined));
        setText(`#error-${field.name}`, messages?.join(" ") ?? "");
    }
    const firstWrong = form.querySelector("[aria-invalid=true]");
    firstWrong?.focus();
}
// ===== Таблица каталога =====
function createRow(game) {
    const row = document.createElement("tr");
    row.dataset.gameId = String(game.id);
    const titleCell = document.createElement("td");
    const link = document.createElement("a");
    link.href = `game.html?id=${game.id}`;
    link.textContent = game.title;
    titleCell.append(link);
    const priceCell = document.createElement("td");
    priceCell.className = "admin-price";
    priceCell.textContent = formatPrice(game.finalPrice);
    const discountCell = document.createElement("td");
    const discountInput = document.createElement("input");
    discountInput.type = "number";
    discountInput.min = "0";
    discountInput.max = "90";
    discountInput.value = String(game.discountPercent);
    discountInput.className = "discount-input";
    discountInput.setAttribute("aria-label", `Скидка на ${game.title}, %`);
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "button-secondary small-button";
    applyButton.dataset.action = "discount";
    applyButton.textContent = "Применить";
    discountCell.append(discountInput, applyButton);
    const actionsCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "button-secondary small-button";
    editButton.dataset.action = "edit";
    editButton.textContent = "Изменить";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button small-button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Удалить";
    actionsCell.append(editButton, deleteButton);
    row.append(titleCell, priceCell, discountCell, actionsCell);
    return row;
}
async function renderAdminGames() {
    const tbody = document.querySelector("#admin-games");
    if (tbody !== null) {
        const games = await fetchGames(ALL_GAMES);
        tbody.replaceChildren(...games.map(createRow));
    }
}
// Подтверждение удаления: свой диалог вместо window.confirm
function confirmDelete(title) {
    const dialog = document.querySelector("#delete-dialog");
    if (dialog === null) {
        return Promise.resolve(false);
    }
    setText("#delete-question", `«${title}» исчезнет из магазина навсегда. Отменить это будет нельзя.`);
    dialog.returnValue = "";
    dialog.showModal();
    return new Promise((resolve) => {
        dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
    });
}
async function onCatalogClick(event) {
    if (!(event.target instanceof HTMLButtonElement)) {
        return;
    }
    const button = event.target;
    const row = button.closest("tr");
    const id = Number(row?.dataset.gameId);
    const title = row?.querySelector("a")?.textContent ?? "";
    if (button.dataset.action === "discount") {
        const input = row?.querySelector(".discount-input");
        button.disabled = true;
        try {
            const result = await putDiscount(id, Number(input?.value));
            if (result.ok) {
                setText(`tr[data-game-id="${id}"] .admin-price`, formatPrice(result.data.finalPrice));
                setText("#admin-catalog-message", `Скидка на «${title}» — ${result.data.discountPercent}%.`);
            }
            else {
                setText("#admin-catalog-message", `«${title}»: ${result.errors["discountPercent"]?.join(" ") ?? result.message}`);
            }
        }
        finally {
            button.disabled = false;
        }
    }
    if (button.dataset.action === "edit") {
        await startEdit(id);
    }
    if (button.dataset.action === "delete" && (await confirmDelete(title))) {
        const result = await deleteGame(id);
        if (result.ok) {
            row?.remove();
            setText("#admin-catalog-message", `«${title}» удалена.`);
        }
        else {
            setText("#admin-catalog-message", result.message);
        }
    }
}
// ===== Форма: добавить или изменить =====
function setMode(id, title = "") {
    editingId = id;
    setText("#game-form-title", id === null ? "Новая игра" : `Изменить игру: ${title}`);
    const cancel = document.querySelector("#cancel-edit");
    if (cancel !== null) {
        cancel.hidden = id === null;
    }
}
async function startEdit(id) {
    const form = document.querySelector("#new-game-form");
    const game = await fetchGame(id);
    if (form === null || game === undefined) {
        return;
    }
    const values = {
        title: game.title,
        slug: game.slug,
        genre: game.genre,
        developer: game.developer,
        releaseYear: String(game.year),
        price: String(game.price),
        discountPercent: String(game.discountPercent),
        description: game.description,
    };
    for (const [name, value] of Object.entries(values)) {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
            field.value = value;
        }
    }
    showErrors(form, {});
    setText("#new-game-message", "");
    setMode(id, game.title);
    form.scrollIntoView({ behavior: "smooth" });
}
export async function setupAdminForm() {
    const form = document.querySelector("#new-game-form");
    const fields = document.querySelector("#new-game-fields");
    const genreSelect = document.querySelector("#new-genre");
    if (form === null || fields === null || genreSelect === null) {
        return;
    }
    for (const genre of await fetchGenres()) {
        const option = document.createElement("option");
        option.value = genre;
        option.textContent = genre;
        genreSelect.append(option);
    }
    await renderAdminGames();
    document.querySelector("#admin-games")?.addEventListener("click", onCatalogClick);
    document.querySelector("#cancel-edit")?.addEventListener("click", () => {
        form.reset();
        showErrors(form, {});
        setMode(null);
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showErrors(form, {});
        const input = readGameInput(form); // до блокировки: поля disabled в FormData не попадают
        setText("#new-game-message", "Сохраняем…");
        fields.disabled = true; // пока ждём ответ — ни править, ни отправить второй раз
        let result;
        try {
            result = editingId === null ? await postGame(input) : await putGame(editingId, input);
        }
        catch (error) {
            setText("#new-game-message", error instanceof Error ? error.message : "Не удалось сохранить игру");
            return;
        }
        finally {
            fields.disabled = false;
        }
        if (result.ok) {
            const link = document.createElement("a");
            link.href = `game.html?id=${result.data.id}`;
            link.textContent = result.data.title;
            const verb = editingId === null ? "Игра добавлена: " : "Изменения сохранены: ";
            document.querySelector("#new-game-message")?.replaceChildren(verb, link);
            form.reset();
            setMode(null);
            await renderAdminGames();
        }
        else {
            showErrors(form, result.errors);
            setText("#new-game-message", "Исправь ошибки в форме.");
        }
    });
}
export function showAdminOffline() {
    const note = document.querySelector("#admin-offline");
    for (const selector of ["#new-game-form", "#admin-catalog"]) {
        const element = document.querySelector(selector);
        if (element !== null) {
            element.hidden = true;
        }
    }
    if (note !== null) {
        note.hidden = false;
    }
}
//# sourceMappingURL=admin.js.map