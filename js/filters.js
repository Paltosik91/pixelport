import { finalPrice } from "./price.js";
function compareGames(a, b, sort) {
    switch (sort) {
        case "price-asc":
            return finalPrice(a) - finalPrice(b);
        case "price-desc":
            return finalPrice(b) - finalPrice(a);
        case "discount":
            return b.discountPercent - a.discountPercent;
        case "new":
            return b.year - a.year;
        case "rating":
            return b.rating - a.rating;
    }
}
export function selectGames(allGames, filters) {
    const query = filters.query.trim().toLowerCase();
    const found = allGames.filter((game) => {
        const matchesQuery = game.title.toLowerCase().includes(query);
        const matchesGenre = filters.genre === "" || game.genre === filters.genre;
        const matchesPrice = filters.maxPrice === null || finalPrice(game) <= filters.maxPrice;
        const matchesSale = !filters.onlySale || game.discountPercent > 0;
        return matchesQuery && matchesGenre && matchesPrice && matchesSale;
    });
    found.sort((a, b) => compareGames(a, b, filters.sort));
    return found;
}
export function getGenres(allGames) {
    const genres = new Set(allGames.map((game) => game.genre));
    return [...genres].sort((a, b) => a.localeCompare(b, "ru"));
}
//# sourceMappingURL=filters.js.map