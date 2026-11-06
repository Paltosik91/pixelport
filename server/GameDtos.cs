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
    string Description);

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
    string[]? Features);

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

// Что присылает клиент, когда пишет отзыв
public record NewReview(int PlayerId, bool IsRecommended, string? Text);

// Как превратить игру из базы в ответ клиенту.
// Это не обычная функция, а выражение: EF Core переведёт его в SQL
public static class GameMapping
{
    public static readonly Expression<Func<Game, GameSummary>> ToSummary = game => new GameSummary(
        game.Id, game.Slug, game.Title, game.Genre.Name, game.ReleaseYear,
        game.Price, game.DiscountPercent, game.FinalPrice,
        // Рейтинг — процент положительных отзывов. Нет отзывов — нет рейтинга
        game.Reviews.Count == 0 ? null : game.Reviews.Count(review => review.IsRecommended) * 100 / game.Reviews.Count,
        game.CoverAlt, game.Description);

    public static readonly Expression<Func<Game, GameDetails>> ToDetails = game => new GameDetails(
        game.Id, game.Slug, game.Title, game.Genre.Name, game.ReleaseYear, game.Developer,
        game.Price, game.DiscountPercent, game.FinalPrice,
        game.Reviews.Count == 0 ? null : game.Reviews.Count(review => review.IsRecommended) * 100 / game.Reviews.Count,
        game.Reviews.Count,
        game.CoverAlt, game.Description,
        game.Tags.OrderBy(tag => tag.Name).Select(tag => tag.Name).ToArray(),
        game.Features == null ? null : game.Features.ToArray());
}
