namespace PixelPort.Api;

public static class GameEndpoints
{
    private static readonly string[] SortOrders = ["rating", "price-asc", "price-desc", "discount", "new"];

    public static void MapGameEndpoints(this WebApplication app, List<Game> games)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/games", (string? q, string? genre, int? maxPrice, bool onlySale = false, string sort = "rating") =>
        {
            if (!SortOrders.Contains(sort))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["sort"] = [$"Неизвестная сортировка «{sort}». Можно: {string.Join(", ", SortOrders)}"],
                });
            }

            IEnumerable<Game> found = games;

            if (!string.IsNullOrWhiteSpace(q))
            {
                found = found.Where(game => game.Title.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            if (!string.IsNullOrEmpty(genre))
            {
                found = found.Where(game => game.Genre == genre);
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
                "new" => found.OrderByDescending(game => game.Year),
                _ => found.OrderByDescending(game => game.Rating),
            };

            return Results.Ok(found.Select(game => game.ToSummary()));
        });

        api.MapGet("/games/{id:int}", (int id) =>
        {
            Game? game = games.Find(item => item.Id == id);
            if (game is null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Игра не найдена",
                    detail: $"В каталоге нет игры с id {id}");
            }
            return Results.Ok(game.ToDetails());
        });

        api.MapGet("/genres", () => games
            .GroupBy(game => game.Genre)
            .Select(group => new GenreInfo(group.Key, group.Count()))
            .OrderBy(genre => genre.Name));
    }
}
