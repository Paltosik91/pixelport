using Microsoft.EntityFrameworkCore;
using PixelPort.Api.Data;

namespace PixelPort.Api;

public static class OrderEndpoints
{
    // Промокоды живут на сервере: список в браузере — только подсказка покупателю
    internal static readonly Dictionary<string, int> PromoCodes = new()
    {
        ["PIXEL10"] = 10,
        ["WINTER25"] = 25,
    };

    public static void MapOrderEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api");

        api.MapPost("/orders", async (PixelPortDb db, NewOrder input) =>
        {
            // 1. Проверяем запрос: кто покупает, что и с каким промокодом
            var errors = new Dictionary<string, string[]>();

            Player? player = await db.Players.FindAsync(input.PlayerId);
            if (player is null)
            {
                errors["playerId"] = [$"Игрока с id {input.PlayerId} нет"];
            }

            int[] gameIds = (input.GameIds ?? []).Distinct().ToArray();
            List<Game> games = await db.Games.Where(game => gameIds.Contains(game.Id)).ToListAsync();
            if (gameIds.Length == 0)
            {
                errors["gameIds"] = ["Корзина пуста"];
            }
            else if (games.Count < gameIds.Length)
            {
                IEnumerable<int> missing = gameIds.Except(games.Select(game => game.Id));
                errors["gameIds"] = [$"Этих игр нет в каталоге: {string.Join(", ", missing)}"];
            }

            string promoCode = input.PromoCode?.Trim().ToUpperInvariant() ?? "";
            int promoPercent = 0;
            if (promoCode != "" && !PromoCodes.TryGetValue(promoCode, out promoPercent))
            {
                errors["promoCode"] = [$"Промокода «{promoCode}» нет"];
            }

            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            // 2. Одну игру дважды не продаём
            List<string> owned = await db.OrderLines
                .Where(line => line.Order.PlayerId == player!.Id && gameIds.Contains(line.GameId))
                .Select(line => line.Game.Title)
                .ToListAsync();
            if (owned.Count > 0)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Игра уже куплена",
                    detail: $"У {player!.Nickname} уже есть: {string.Join(", ", owned)}. Убери из корзины то, что уже куплено.");
            }

            // 3. Цены берём из базы, а не от клиента — и запоминаем в строках заказа
            var order = new Order
            {
                Player = player!,
                CreatedAt = DateTime.UtcNow,
                PromoCode = promoCode == "" ? null : promoCode,
                Lines = games.Select(game => new OrderLine { Game = game, Price = game.FinalPrice }).ToList(),
            };
            int subtotal = order.Lines.Sum(line => line.Price);
            order.Total = subtotal - subtotal * promoPercent / 100;

            // 4. Заказ и все его строки — одной транзакцией: либо всё, либо ничего
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            return Results.Created($"/api/orders/{order.Id}", ToInfo(order));
        });

        api.MapGet("/players/{id:int}/library", async (PixelPortDb db, int id) =>
        {
            if (!await db.Players.AnyAsync(player => player.Id == id))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Игрок не найден",
                    detail: $"Игрока с id {id} нет");
            }

            List<LibraryItem> library = await db.OrderLines
                .Where(line => line.Order.PlayerId == id)
                .OrderByDescending(line => line.Order.CreatedAt)
                .Select(line => new LibraryItem(
                    line.GameId, line.Game.Slug, line.Game.Title,
                    line.Price, line.Order.CreatedAt, line.OrderId))
                .ToListAsync();
            return Results.Ok(library);
        });
    }

    private static OrderInfo ToInfo(Order order)
    {
        List<OrderLineInfo> games = order.Lines
            .Select(line => new OrderLineInfo(line.GameId, line.Game.Title, line.Price))
            .ToList();
        int subtotal = games.Sum(game => game.Price);
        return new OrderInfo(
            order.Id, order.CreatedAt, order.Player.Nickname,
            games, subtotal, subtotal - order.Total, order.Total);
    }
}
