import { getSaleState, pad, splitTime } from "./sale.js";
import { setText } from "./dom.js";

const PHASE_LABELS = {
  before: "До старта распродажи",
  running: "До конца распродажи",
  finished: "Распродажа завершена",
};

export function startSaleTimer(): void {
  const timer = document.querySelector<HTMLDivElement>("#sale-timer");
  if (timer === null) {
    return;
  }

  const tick = (): void => {
    const state = getSaleState(new Date());
    setText("#sale-label", PHASE_LABELS[state.phase]);

    const time = splitTime(state.msLeft);
    setText("#timer-days", pad(time.days));
    setText("#timer-hours", pad(time.hours));
    setText("#timer-minutes", pad(time.minutes));
    setText("#timer-seconds", pad(time.seconds));

    if (state.phase === "finished") {
      timer.hidden = true;
      clearInterval(intervalId);
    }
  };

  const intervalId = setInterval(tick, 1000);
  tick();
}
