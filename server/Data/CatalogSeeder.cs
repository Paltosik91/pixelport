using System.Text.Json;

namespace PixelPort.Api.Data;

// Начальные данные: если база пустая, переносим в неё игры из catalog.json
public static class CatalogSeeder
{
    private record CatalogItem(
        string Slug, string Title, string Genre, int Year, string Developer,
        int Price, int DiscountPercent, int Rating, string CoverAlt, string Description,
        string[] Tags, string[]? Features);

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
                Rating = item.Rating,
                CoverAlt = item.CoverAlt,
                Description = item.Description,
                Features = item.Features?.ToList(),
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
}
