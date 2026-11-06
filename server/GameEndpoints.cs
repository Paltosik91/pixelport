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
                _ => found.OrderByDescending(game => game.Rating),
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

        api.MapGet("/genres", async (PixelPortDb db) => await db.Genres
            .OrderBy(genre => genre.Name)
            .Select(genre => new GenreInfo(genre.Name, genre.Games.Count))
            .ToListAsync());
    }
}
