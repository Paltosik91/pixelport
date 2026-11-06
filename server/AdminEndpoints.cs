using Microsoft.EntityFrameworkCore;
using PixelPort.Api.Data;

namespace PixelPort.Api;

// Всё, что меняет каталог: добавить, изменить, скидка, удалить
public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api/games");

        api.MapPost("/", async (PixelPortDb db, GameInput input) =>
        {
            (Dictionary<string, string[]> errors, Genre? genre) = await ValidateAsync(db, input, gameId: null);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var game = new Game
            {
                Slug = "", Title = "", Developer = "", Description = "",
                CoverAlt = $"Обложка игры {input.Title!.Trim()}",
            };
            Apply(game, input, genre!);
            db.Games.Add(game);
            await db.SaveChangesAsync();

            return Results.Created($"/api/games/{game.Id}", await LoadDetailsAsync(db, game.Id));
        });

        api.MapPut("/{id:int}", async (PixelPortDb db, int id, GameInput input) =>
        {
            Game? game = await db.Games.FindAsync(id);
            if (game is null)
            {
                return GameNotFound(id);
            }

            (Dictionary<string, string[]> errors, Genre? genre) = await ValidateAsync(db, input, gameId: id);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            Apply(game, input, genre!);
            await db.SaveChangesAsync();
            return Results.Ok(await LoadDetailsAsync(db, id));
        });

        api.MapPut("/{id:int}/discount", async (PixelPortDb db, int id, DiscountInput input) =>
        {
            Game? game = await db.Games.FindAsync(id);
            if (game is null)
            {
                return GameNotFound(id);
            }
            if (!GameValidation.IsValidDiscount(input.DiscountPercent))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["discountPercent"] = [GameValidation.DiscountError],
                });
            }

            game.DiscountPercent = input.DiscountPercent;
            await db.SaveChangesAsync();
            return Results.Ok(await LoadDetailsAsync(db, id));
        });

        api.MapDelete("/{id:int}", async (PixelPortDb db, int id) =>
        {
            Game? game = await db.Games.FindAsync(id);
            if (game is null)
            {
                return GameNotFound(id);
            }

            int reviews = await db.Reviews.CountAsync(review => review.GameId == id);
            if (reviews > 0)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Игру нельзя удалить",
                    detail: $"У игры «{game.Title}» есть отзывы игроков ({reviews}). Удалить можно только игру без отзывов.");
            }

            db.Games.Remove(game);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    // Все проверки сразу: без базы (GameValidation) и с базой
    private static async Task<(Dictionary<string, string[]> Errors, Genre? Genre)> ValidateAsync(
        PixelPortDb db, GameInput input, int? gameId)
    {
        Dictionary<string, string[]> errors = GameValidation.Validate(input);

        Genre? genre = await db.Genres.FirstOrDefaultAsync(item => item.Name == input.Genre);
        if (genre is null && !errors.ContainsKey("genre"))
        {
            errors["genre"] = [$"Жанра «{input.Genre}» нет в каталоге"];
        }

        // Свой собственный адрес при изменении — не конфликт
        string slug = input.Slug?.Trim() ?? "";
        if (!errors.ContainsKey("slug") &&
            await db.Games.AnyAsync(game => game.Slug == slug && game.Id != gameId))
        {
            errors["slug"] = [$"Адрес «{slug}» уже занят другой игрой"];
        }

        return (errors, genre);
    }

    private static void Apply(Game game, GameInput input, Genre genre)
    {
        game.Slug = input.Slug!.Trim();
        game.Title = input.Title!.Trim();
        game.Genre = genre;
        game.Developer = input.Developer!.Trim();
        game.ReleaseYear = input.ReleaseYear;
        game.Price = input.Price;
        game.DiscountPercent = input.DiscountPercent;
        game.Description = input.Description!.Trim();
    }

    private static Task<GameDetails> LoadDetailsAsync(PixelPortDb db, int id) =>
        db.Games.Where(game => game.Id == id).Select(GameMapping.ToDetails).FirstAsync();

    private static IResult GameNotFound(int id) => Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Игра не найдена",
        detail: $"В каталоге нет игры с id {id}");
}
