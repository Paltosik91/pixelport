using Microsoft.EntityFrameworkCore;
using PixelPort.Api.Data;

namespace PixelPort.Api;

public static class GameEndpoints
{
    private static readonly string[] SortOrders = ["rating", "price-asc", "price-desc", "discount", "new"];

    public static void MapGameEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/games", async (PixelPortDb db, string? q, string? genre, int? maxPrice, bool onlySale = false, string sort = "rating") =>
        {
            if (!SortOrders.Contains(sort))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["sort"] = [$"Неизвестная сортировка «{sort}». Можно: {string.Join(", ", SortOrders)}"],
                });
            }

            IQueryable<Game> found = db.Games;

            if (!string.IsNullOrWhiteSpace(q))
            {
                found = found.Where(game => EF.Functions.ILike(game.Title, $"%{q.Trim()}%"));
            }
            if (!string.IsNullOrEmpty(genre))
            {
                found = found.Where(game => game.Genre.Name == genre);
            }
            if (maxPrice is not null)
            {
                found = found.Where(game => game.FinalPrice <= maxPrice);
            }
            if (onlySale)
            {
                found = found.Where(game => game.DiscountPercent > 0);
            }

            found = sort switch
            {
                "price-asc" => found.OrderBy(game => game.FinalPrice),
                "price-desc" => found.OrderByDescending(game => game.FinalPrice),
                "discount" => found.OrderByDescending(game => game.DiscountPercent),
                "new" => found.OrderByDescending(game => game.ReleaseYear),
                // Та же формула рейтинга, что в GameMapping; игры без отзывов — в конце
                _ => found.OrderByDescending(game => game.Reviews.Count == 0
                    ? -1
                    : game.Reviews.Count(review => review.IsRecommended) * 100 / game.Reviews.Count),
            };

            List<GameSummary> result = await found.Select(GameMapping.ToSummary).ToListAsync();
            return Results.Ok(result);
        });

        api.MapGet("/games/{id:int}", async (PixelPortDb db, int id) =>
        {
            GameDetails? game = await db.Games
                .Where(item => item.Id == id)
                .Select(GameMapping.ToDetails)
                .FirstOrDefaultAsync();

            if (game is null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Игра не найдена",
                    detail: $"В каталоге нет игры с id {id}");
            }
            return Results.Ok(game);
        });

        api.MapGet("/games/{id:int}/similar", async (PixelPortDb db, int id) =>
        {
            // 1. Теги исходной игры
            Game? game = await db.Games
                .Include(item => item.Tags)
                .FirstOrDefaultAsync(item => item.Id == id);
            if (game is null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Игра не найдена",
                    detail: $"В каталоге нет игры с id {id}");
            }
            List<int> tagIds = game.Tags.Select(tag => tag.Id).ToList();

            // 2. Другие игры с общими тегами: чем больше общих, тем выше; при равенстве — сначала тот же жанр
            var matches = await db.Games
                .Where(other => other.Id != id)
                .Select(other => new
                {
                    other.Id,
                    other.Title,
                    SameGenre = other.GenreId == game.GenreId,
                    CommonTags = other.Tags
                        .Where(tag => tagIds.Contains(tag.Id))
                        .OrderBy(tag => tag.Name)
                        .Select(tag => tag.Name)
                        .ToList(),
                })
                .Where(match => match.CommonTags.Count > 0)
                .OrderByDescending(match => match.CommonTags.Count)
                .ThenByDescending(match => match.SameGenre)
                .ThenBy(match => match.Title)
                .Take(4)
                .ToListAsync();

            // 3. Карточки найденных игр — одним запросом, потом в порядке похожести
            List<int> ids = matches.Select(match => match.Id).ToList();
            Dictionary<int, GameSummary> cards = await db.Games
                .Where(other => ids.Contains(other.Id))
                .Select(GameMapping.ToSummary)
                .ToDictionaryAsync(card => card.Id);

            List<SimilarGame> similar = matches
                .Select(match => new SimilarGame(cards[match.Id], match.CommonTags))
                .ToList();
            return Results.Ok(similar);
        });

        api.MapGet("/genres", async (PixelPortDb db) => await db.Genres
            .OrderBy(genre => genre.Name)
            .Select(genre => new GenreInfo(genre.Name, genre.Games.Count))
            .ToListAsync());
    }
}
