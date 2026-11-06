import type { Game, Genre } from "./models.js";

export type SortOrder = "rating" | "price-asc" | "price-desc" | "discount" | "new";

export interface CatalogFilters {
  query: string;
  genre: Genre | "";
  maxPrice: number | null;
  onlySale: boolean;
  sort: SortOrder;
}

function compareGames(a: Game, b: Game, sort: SortOrder): number {
  switch (sort) {
    case "price-asc":
      return a.finalPrice - b.finalPrice;
    case "price-desc":
      return b.finalPrice - a.finalPrice;
    case "discount":
      return b.discountPercent - a.discountPercent;
    case "new":
      return b.year - a.year;
    case "rating":
      return (b.rating ?? -1) - (a.rating ?? -1);
  }
}

export function selectGames(allGames: Game[], filters: CatalogFilters): Game[] {
  const query = filters.query.trim().toLowerCase();

  const found = allGames.filter((game) => {
    const matchesQuery = game.title.toLowerCase().includes(query);
    const matchesGenre = filters.genre === "" || game.genre === filters.genre;
    const matchesPrice = filters.maxPrice === null || game.finalPrice <= filters.maxPrice;
    const matchesSale = !filters.onlySale || game.discountPercent > 0;
    return matchesQuery && matchesGenre && matchesPrice && matchesSale;
  });

  found.sort((a, b) => compareGames(a, b, filters.sort));
  return found;
}

export function getGenres(allGames: Game[]): Genre[] {
  const genres = new Set(allGames.map((game) => game.genre));
  return [...genres].sort((a, b) => a.localeCompare(b, "ru"));
}
