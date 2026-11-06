export type Genre =
  | "Приключения"
  | "Гонки"
  | "Стратегии"
  | "Головоломки"
  | "Хоррор"
  | "Симуляторы"
  | "Платформеры"
  | "Спорт";

// Игра в списке: всё для карточки. Цену со скидкой считает сервер
export interface Game {
  id: number;
  slug: string;
  title: string;
  genre: Genre;
  year: number;
  price: number;
  discountPercent: number;
  finalPrice: number;
  rating: number;
  coverAlt: string;
  description: string;
}

// Игра на своей странице: всё о ней
export interface GameDetails extends Game {
  developer: string;
  tags: string[];
  features?: string[] | null;
}
