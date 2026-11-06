// Код студента: у каждого на общем компьютере свой, например "is31-petrova"
const STUDENT_CODE = "is31-ivanov";
function storageKey(name) {
    return `pixelport:${STUDENT_CODE}:${name}`;
}
export function loadIds(name) {
    const raw = localStorage.getItem(storageKey(name));
    if (raw === null) {
        return new Set();
    }
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "number")) {
            return new Set(parsed);
        }
    }
    catch {
        // В хранилище лежит не JSON — считаем, что данных нет
    }
    return new Set();
}
export function saveIds(name, ids) {
    localStorage.setItem(storageKey(name), JSON.stringify([...ids]));
}
export function loadText(name) {
    return localStorage.getItem(storageKey(name));
}
export function saveText(name, value) {
    localStorage.setItem(storageKey(name), value);
}
//# sourceMappingURL=storage.js.map