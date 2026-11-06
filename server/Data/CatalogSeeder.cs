using System.Text.Json;

namespace PixelPort.Api.Data;

// Начальные данные: если база пустая, переносим в неё игры из catalog.json
public static class CatalogSeeder
{
    private record CatalogItem(
        string Slug, string Title, string Genre, int Year, string Developer,
        int Price, int DiscountPercent, string CoverAlt, string Description,
        string[] Tags, string[]? Features, bool EditorsChoice = false);

    public static int SeedIfEmpty(PixelPortDb db, string catalogPath)
    {
        if (db.Games.Any())
        {
            return 0;
        }

        string json = File.ReadAllText(catalogPath);
        var items = JsonSerializer.Deserialize<List<CatalogItem>>(json, JsonSerializerOptions.Web)
            ?? throw new InvalidDataException($"Файл {catalogPath} пуст");

        var genres = new Dictionary<string, Genre>();
        var tags = new Dictionary<string, Tag>();

        foreach (CatalogItem item in items)
        {
            if (!genres.TryGetValue(item.Genre, out Genre? genre))
            {
                genre = new Genre { Name = item.Genre };
                genres.Add(item.Genre, genre);
            }

            var game = new Game
            {
                Slug = item.Slug,
                Title = item.Title,
                Developer = item.Developer,
                ReleaseYear = item.Year,
                Price = item.Price,
                DiscountPercent = item.DiscountPercent,
                CoverAlt = item.CoverAlt,
                Description = item.Description,
                Features = item.Features?.ToList(),
                IsEditorsChoice = item.EditorsChoice,
                Genre = genre,
            };

            foreach (string name in item.Tags)
            {
                if (!tags.TryGetValue(name, out Tag? tag))
                {
                    tag = new Tag { Name = name };
                    tags.Add(name, tag);
                }
                game.Tags.Add(tag);
            }

            db.Games.Add(game);
            db.SaveChanges(); // по одной, чтобы номера игр совпали с catalog.json
        }

        return items.Count;
    }

    private record SeedPlayer(string Nickname, string AvatarUrl);
    private record SeedReview(string Game, string Player, bool IsRecommended, string Text, DateTime CreatedAt);
    private record SeedReviews(List<SeedPlayer> Players, List<SeedReview> Reviews);

    // Игроки и отзывы для начала: если игроков нет, переносим их из reviews.json
    public static int SeedReviewsIfEmpty(PixelPortDb db, string reviewsPath)
    {
        if (db.Players.Any())
        {
            return 0;
        }

        string json = File.ReadAllText(reviewsPath);
        var seed = JsonSerializer.Deserialize<SeedReviews>(json, JsonSerializerOptions.Web)
            ?? throw new InvalidDataException($"Файл {reviewsPath} пуст");

        var players = seed.Players.ToDictionary(
            item => item.Nickname,
            item => new Player { Nickname = item.Nickname, AvatarUrl = item.AvatarUrl });
        db.Players.AddRange(players.Values);

        var games = db.Games.ToDictionary(game => game.Slug);
        foreach (SeedReview item in seed.Reviews)
        {
            db.Reviews.Add(new Review
            {
                Game = games[item.Game],
                Player = players[item.Player],
                IsRecommended = item.IsRecommended,
                Text = item.Text,
                CreatedAt = item.CreatedAt,
            });
        }

        db.SaveChanges();
        return seed.Reviews.Count;
    }

    private record SeedLine(string Game, int Price);
    private record SeedOrder(string Player, int DaysAgo, TimeSpan Time, string? PromoCode, List<SeedLine> Games);
    private record SeedOrders(List<SeedOrder> Orders);

    // История продаж для дашборда: если заказов нет, переносим их из orders.json.
    // Даты считаются от сегодняшнего дня — история всегда «свежая»
    public static int SeedOrdersIfEmpty(PixelPortDb db, string ordersPath)
    {
        if (db.Orders.Any())
        {
            return 0;
        }

        string json = File.ReadAllText(ordersPath);
        var seed = JsonSerializer.Deserialize<SeedOrders>(json, JsonSerializerOptions.Web)
            ?? throw new InvalidDataException($"Файл {ordersPath} пуст");

        var players = db.Players.ToDictionary(player => player.Nickname);
        var games = db.Games.ToDictionary(game => game.Slug);
        foreach (SeedOrder item in seed.Orders)
        {
            var order = new Order
            {
                Player = players[item.Player],
                CreatedAt = DateTime.UtcNow.Date.AddDays(-item.DaysAgo).Add(item.Time),
                PromoCode = item.PromoCode,
                Lines = item.Games
                    .Select(line => new OrderLine { Game = games[line.Game], Price = line.Price })
                    .ToList(),
            };
            int subtotal = order.Lines.Sum(line => line.Price);
            int percent = item.PromoCode is null ? 0 : OrderEndpoints.PromoCodes[item.PromoCode];
            order.Total = subtotal - subtotal * percent / 100;
            db.Orders.Add(order);
        }

        db.SaveChanges();
        return seed.Orders.Count;
    }
}
