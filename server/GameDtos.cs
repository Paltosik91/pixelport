using System.Linq.Expressions;
using PixelPort.Api.Data;

namespace PixelPort.Api;

// То, что видит клиент в списке: всё для карточки, ничего лишнего
public record GameSummary(
    int Id,
    string Slug,
    string Title,
    string Genre,
    int Year,
    int Price,
    int DiscountPercent,
    int FinalPrice,
    int? Rating,
    string CoverAlt,
    string Description,
    bool IsEditorsChoice);

// То, что видит клиент на странице игры: всё
public record GameDetails(
    int Id,
    string Slug,
    string Title,
    string Genre,
    int Year,
    string Developer,
    int Price,
    int DiscountPercent,
    int FinalPrice,
    int? Rating,
    int ReviewsCount,
    string CoverAlt,
    string Description,
    string[] Tags,
    string[]? Features,
    bool IsEditorsChoice);

public record GenreInfo(string Name, int Count);

public record PlayerInfo(int Id, string Nickname, string AvatarUrl);

public record ReviewInfo(int Id, string Player, string AvatarUrl, bool IsRecommended, string Text, DateTime CreatedAt);

// Что присылает админка, когда добавляет или изменяет игру
public record GameInput(
    string? Title,
    string? Slug,
    string? Genre,
    string? Developer,
    int ReleaseYear,
    int Price,
    int DiscountPercent,
    string? Description);

// Новая скидка — одно поле
public record DiscountInput(int DiscountPercent);

// Отметка «Выбор редакции»: bool? — чтобы отличить «нет поля» от false
public record EditorsChoiceInput(bool? IsEditorsChoice);

// Что присылает клиент, когда пишет отзыв
public record NewReview(int PlayerId, bool IsRecommended, string? Text);

// Статистика продаж для дашборда
public record GenreSales(string Genre, int Sold, int Revenue);

public record GameSales(int GameId, string Title, int Sold, int Revenue);

public record SalesStats(
    int Revenue,
    int OrdersCount,
    int GamesSold,
    int AverageOrder,
    int PromoDiscount,
    List<GenreSales> ByGenre,
    List<GameSales> TopGames);

// Похожая игра: карточка и теги, общие с исходной игрой
public record SimilarGame(GameSummary Game, List<string> CommonTags);

// Заказ: кто покупает и что. Цены клиент не присылает — их знает только сервер
public record NewOrder(int PlayerId, int[]? GameIds, string? PromoCode);

public record OrderLineInfo(int GameId, string Title, int Price);

public record OrderInfo(
    int Id,
    DateTime CreatedAt,
    string Player,
    List<OrderLineInfo> Games,
    int Subtotal,
    int Discount,
    int Total);

// Игра в библиотеке игрока
public record LibraryItem(int GameId, string Slug, string Title, int Price, DateTime PurchasedAt, int OrderId);

// Как превратить игру из базы в ответ клиенту.
// Это не обычная функция, а выражение: EF Core переведёт его в SQL
public static class GameMapping
{
    public static readonly Expression<Func<Game, GameSummary>> ToSummary = game => new GameSummary(
        game.Id, game.Slug, game.Title, game.Genre.Name, game.ReleaseYear,
        game.Price, game.DiscountPercent, game.FinalPrice,
        // Рейтинг — процент положительных отзывов. Нет отзывов — нет рейтинга
        game.Reviews.Count == 0 ? null : game.Reviews.Count(review => review.IsRecommended) * 100 / game.Reviews.Count,
        game.CoverAlt, game.Description, game.IsEditorsChoice);

    public static readonly Expression<Func<Game, GameDetails>> ToDetails = game => new GameDetails(
        game.Id, game.Slug, game.Title, game.Genre.Name, game.ReleaseYear, game.Developer,
        game.Price, game.DiscountPercent, game.FinalPrice,
        game.Reviews.Count == 0 ? null : game.Reviews.Count(review => review.IsRecommended) * 100 / game.Reviews.Count,
        game.Reviews.Count,
        game.CoverAlt, game.Description,
        game.Tags.OrderBy(tag => tag.Name).Select(tag => tag.Name).ToArray(),
        game.Features == null ? null : game.Features.ToArray(),
        game.IsEditorsChoice);
}
