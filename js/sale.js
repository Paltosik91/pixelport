export const SALE_START = new Date("2026-12-20T00:00:00+03:00");
export const SALE_END = new Date("2027-01-10T23:59:59+03:00");
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export function getSaleState(now) {
    if (now < SALE_START) {
        return { phase: "before", msLeft: SALE_START.getTime() - now.getTime() };
    }
    if (now < SALE_END) {
        return { phase: "running", msLeft: SALE_END.getTime() - now.getTime() };
    }
    return { phase: "finished", msLeft: 0 };
}
export function splitTime(ms) {
    return {
        days: Math.floor(ms / DAY),
        hours: Math.floor((ms % DAY) / HOUR),
        minutes: Math.floor((ms % HOUR) / MINUTE),
        seconds: Math.floor((ms % MINUTE) / SECOND),
    };
}
export function pad(value) {
    return String(value).padStart(2, "0");
}
export function pickGameOfDay(allGames, date) {
    const dayNumber = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    return allGames[dayNumber % allGames.length];
}
//# sourceMappingURL=sale.js.map