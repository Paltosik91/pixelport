import type { Player } from "./models.js";
import { fetchPlayers } from "./api.js";
import { loadText, saveText } from "./storage.js";

// «Играю как…» — учебная замена входа в аккаунт: игрок выбирается из списка
let players: Player[] = [];
let currentId: number | null = null;

export function getCurrentPlayer(): Player | undefined {
  return players.find((player) => player.id === currentId);
}

export async function setupPlayerSwitch(): Promise<void> {
  const nav = document.querySelector("header nav ul");
  if (nav === null) {
    return;
  }

  players = await fetchPlayers();
  const saved = Number(loadText("player"));
  currentId = players.some((player) => player.id === saved) ? saved : (players[0]?.id ?? null);

  const avatar = document.createElement("img");
  avatar.className = "player-avatar";
  avatar.alt = "";
  avatar.width = 32;
  avatar.height = 32;

  const select = document.createElement("select");
  select.id = "player";
  select.setAttribute("aria-label", "Играю как");
  for (const player of players) {
    const option = document.createElement("option");
    option.value = String(player.id);
    option.textContent = player.nickname;
    select.append(option);
  }
  select.value = String(currentId);

  const showAvatar = (): void => {
    avatar.src = getCurrentPlayer()?.avatarUrl ?? "";
  };
  showAvatar();

  select.addEventListener("change", () => {
    currentId = Number(select.value);
    saveText("player", select.value);
    showAvatar();
    document.dispatchEvent(new CustomEvent("playerchange"));
  });

  const item = document.createElement("li");
  item.className = "player-switch";
  item.append(avatar, select);
  nav.append(item);
}
