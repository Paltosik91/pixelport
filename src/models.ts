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

export interface GameInput {
  title: string;
  slug: string;
  genre: string;
  developer: string;
  releaseYear: number;
  price: number;
  discountPercent: number;
  description: string;
}

// Заказ: кто и что покупает. Цен здесь нет — их знает сервер
export interface NewOrder {
  playerId: number;
  gameIds: number[];
  promoCode: string;
}

export interface OrderLine {
  gameId: number;
  title: string;
  price: number;
}

export interface Order {
  id: number;
  createdAt: string;
  player: string;
  games: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
}

export interface LibraryItem {
  gameId: number;
  slug: string;
  title: string;
  price: number;
  purchasedAt: string;
  orderId: number;
}

// Похожая игра: карточка и общие с исходной игрой теги
export interface SimilarGame {
  game: Game;
  commonTags: string[];
}

// Статистика продаж для дашборда
export interface GenreSales {
  genre: string;
  sold: number;
  revenue: number;
}

export interface GameSales {
  gameId: number;
  title: string;
  sold: number;
  revenue: number;
}

export interface SalesStats {
  revenue: number;
  ordersCount: number;
  gamesSold: number;
  averageOrder: number;
  promoDiscount: number;
  byGenre: GenreSales[];
  topGames: GameSales[];
}
