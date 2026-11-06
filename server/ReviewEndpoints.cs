using Microsoft.EntityFrameworkCore;
using PixelPort.Api.Data;

namespace PixelPort.Api;

public static class ReviewEndpoints
{
    public static void MapReviewEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/players", async (PixelPortDb db) => await db.Players
            .OrderBy(player => player.Id)
            .Select(player => new PlayerInfo(player.Id, player.Nickname, player.AvatarUrl))
            .ToListAsync());

        api.MapGet("/games/{id:int}/reviews", async (PixelPortDb db, int id) =>
        {
            if (!await db.Games.AnyAsync(game => game.Id == id))
            {
                return GameNotFound(id);
            }

            List<ReviewInfo> reviews = await db.Reviews
                .Where(review => review.GameId == id)
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new ReviewInfo(
                    review.Id, review.Player.Nickname, review.Player.AvatarUrl,
                    review.IsRecommended, review.Text, review.CreatedAt))
                .ToListAsync();
            return Results.Ok(reviews);
        });

        api.MapPost("/games/{id:int}/reviews", async (PixelPortDb db, int id, NewReview input) =>
        {
            if (!await db.Games.AnyAsync(game => game.Id == id))
            {
                return GameNotFound(id);
            }

            // Проверяем всё, что прислал клиент: ему нельзя доверять
            var errors = new Dictionary<string, string[]>();
            string text = input.Text?.Trim() ?? "";
            if (text.Length < 10)
            {
                errors["text"] = ["Напиши хотя бы 10 символов"];
            }
            else if (text.Length > 1000)
            {
                errors["text"] = ["Не больше 1000 символов"];
            }

            Player? player = await db.Players.FindAsync(input.PlayerId);
            if (player is null)
            {
                errors["playerId"] = [$"Игрока с id {input.PlayerId} нет"];
            }

            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var review = new Review
            {
                GameId = id,
                Player = player!,
                IsRecommended = input.IsRecommended,
                Text = text,
                CreatedAt = DateTime.UtcNow,
            };
            db.Reviews.Add(review);
            await db.SaveChangesAsync();

            var created = new ReviewInfo(
                review.Id, player!.Nickname, player.AvatarUrl,
                review.IsRecommended, review.Text, review.CreatedAt);
            return Results.Created($"/api/games/{id}/reviews", created);
        });
    }

    private static IResult GameNotFound(int id) => Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Игра не найдена",
        detail: $"В каталоге нет игры с id {id}");
}
