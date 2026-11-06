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
    int Rating,
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
    int Rating,
    string CoverAlt,
    string Description,
    string[] Tags,
    string[]? Features);

public record GenreInfo(string Name, int Count);

public static class GameMapping
{
    public static GameSummary ToSummary(this Game game) => new(
        game.Id, game.Slug, game.Title, game.Genre, game.Year,
        game.Price, game.DiscountPercent, game.FinalPrice, game.Rating,
        game.CoverAlt, game.Description);

    public static GameDetails ToDetails(this Game game) => new(
        game.Id, game.Slug, game.Title, game.Genre, game.Year, game.Developer,
        game.Price, game.DiscountPercent, game.FinalPrice, game.Rating,
        game.CoverAlt, game.Description, game.Tags, game.Features);
}
