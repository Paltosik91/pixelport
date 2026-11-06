export type Genre =
  | "Приключения"
  | "Гонки"
  | "Стратегии"
  | "Головоломки"
  | "Хоррор"
  | "Симуляторы"
  | "Платформеры"
  | "Спорт";

export interface Game {
  id: number;
  slug: string;
  title: string;
  genre: Genre;
  year: number;
  developer: string;
  price: number;
  discountPercent: number;
  rating: number;
  coverAlt: string;
  description: string;
  tags: string[];
}
