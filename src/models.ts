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
  rating: number | null;
  coverAlt: string;
  description: string;
}

// Игра на своей странице: всё о ней
export interface GameDetails extends Game {
  developer: string;
  tags: string[];
  features?: string[] | null;
  reviewsCount?: number;
}

export interface Player {
  id: number;
  nickname: string;
  avatarUrl: string;
}

export interface Review {
  id: number;
  player: string;
  avatarUrl: string;
  isRecommended: boolean;
  text: string;
  createdAt: string;
}

export interface NewReview {
  playerId: number;
  isRecommended: boolean;
  text: string;
}
