import type { GameSales, GenreSales, SalesStats } from "./models.js";
import { fetchStats } from "./api.js";
import { formatPrice } from "./price.js";
import { setText } from "./dom.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// Размеры диаграммы в единицах viewBox: на экране SVG растянется по ширине блока
const CHART_WIDTH = 640;
const LABEL_WIDTH = 130;
const BAR_MAX_WIDTH = 380;
const ROW_HEIGHT = 36;
const BAR_HEIGHT = 22;

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

export function createBarChart(items: GenreSales[]): SVGSVGElement {
  const height = items.length * ROW_HEIGHT;
  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${CHART_WIDTH} ${height}`,
    role: "img",
    "aria-label": "Выручка по жанрам",
  });

  // Масштаб: самый большой столбец — во всю ширину, остальные — пропорционально
  const max = Math.max(...items.map((item) => item.revenue));
  const scale = (value: number): number => (max === 0 ? 0 : (value / max) * BAR_MAX_WIDTH);

  items.forEach((item, index) => {
    const y = index * ROW_HEIGHT;
    const barWidth = scale(item.revenue);

    const label = createSvgElement("text", { x: LABEL_WIDTH - 10, y: y + ROW_HEIGHT / 2, class: "chart-label" });
    label.textContent = item.genre;

    const bar = createSvgElement("rect", {
      x: LABEL_WIDTH,
      y: y + (ROW_HEIGHT - BAR_HEIGHT) / 2,
      width: barWidth,
      height: BAR_HEIGHT,
      rx: 4,
      class: "chart-bar",
    });

    const value = createSvgElement("text", { x: LABEL_WIDTH + barWidth + 8, y: y + ROW_HEIGHT / 2, class: "chart-value" });
    value.textContent = formatPrice(item.revenue);

    svg.append(label, bar, value);
  });

  return svg;
}

function createTopRow(game: GameSales, place: number): HTMLTableRowElement {
  const row = document.createElement("tr");

  const placeCell = document.createElement("td");
  placeCell.textContent = String(place);

  const titleCell = document.createElement("td");
  const link = document.createElement("a");
  link.href = `game.html?id=${game.gameId}`;
  link.textContent = game.title;
  titleCell.append(link);

  const soldCell = document.createElement("td");
  soldCell.textContent = String(game.sold);

  const revenueCell = document.createElement("td");
  revenueCell.textContent = formatPrice(game.revenue);

  row.append(placeCell, titleCell, soldCell, revenueCell);
  return row;
}

function renderStats(stats: SalesStats): void {
  setText("#stat-revenue", formatPrice(stats.revenue));
  setText("#stat-orders", String(stats.ordersCount));
  setText("#stat-sold", String(stats.gamesSold));
  setText("#stat-average", formatPrice(stats.averageOrder));

  const chart = document.querySelector("#genre-chart");
  if (stats.byGenre.length === 0) {
    chart?.replaceChildren();
    setText("#genre-note", "Продаж пока нет — диаграмма появится после первого заказа.");
  } else {
    chart?.replaceChildren(createBarChart(stats.byGenre));
    setText(
      "#genre-note",
      `Выручка по жанрам — по ценам игр в заказах. По промокодам покупатели сэкономили ещё ${formatPrice(stats.promoDiscount)}, поэтому общая выручка меньше суммы столбцов.`,
    );
  }

  document.querySelector("#top-games")?.replaceChildren(
    ...stats.topGames.map((game, index) => createTopRow(game, index + 1)),
  );
}

export async function setupStats(): Promise<void> {
  const content = document.querySelector<HTMLElement>("#stats-content");
  if (content === null) {
    return;
  }
  renderStats(await fetchStats());
  content.hidden = false;
}

export function showStatsOffline(): void {
  const offline = document.querySelector<HTMLElement>("#stats-offline");
  if (offline !== null) {
    offline.hidden = false;
  }
}
