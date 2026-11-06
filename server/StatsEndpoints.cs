using Microsoft.EntityFrameworkCore;
using PixelPort.Api.Data;

namespace PixelPort.Api;

public static class StatsEndpoints
{
    public static void MapStatsEndpoints(this WebApplication app)
    {
        app.MapGet("/api/stats", async (PixelPortDb db) =>
        {
            // 1. Итоги: каждое число — отдельный запрос, считает база
            int ordersCount = await db.Orders.CountAsync();
            int revenue = await db.Orders.SumAsync(order => order.Total);
            int gamesSold = await db.OrderLines.CountAsync();
            int linesTotal = await db.OrderLines.SumAsync(line => line.Price);
            int averageOrder = ordersCount == 0 ? 0 : revenue / ordersCount;

            // 2. Выручка по жанрам: GROUP BY в базе, в C# приходит по строке на жанр
            List<GenreSales> byGenre = await db.OrderLines
                .GroupBy(line => line.Game.Genre.Name)
                .OrderByDescending(group => group.Sum(line => line.Price))
                .Select(group => new GenreSales(group.Key, group.Count(), group.Sum(line => line.Price)))
                .ToListAsync();

            // 3. Топ-5 игр по выручке
            List<GameSales> topGames = await db.OrderLines
                .GroupBy(line => new { line.GameId, line.Game.Title })
                .OrderByDescending(group => group.Sum(line => line.Price))
                .ThenBy(group => group.Key.Title)
                .Take(5)
                .Select(group => new GameSales(
                    group.Key.GameId, group.Key.Title, group.Count(), group.Sum(line => line.Price)))
                .ToListAsync();

            return new SalesStats(
                revenue, ordersCount, gamesSold, averageOrder,
                linesTotal - revenue, byGenre, topGames);
        });
    }
}
