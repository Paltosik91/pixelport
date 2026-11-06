namespace PixelPort.Api;

public record Game(
    int Id,
    string Slug,
    string Title,
    string Genre,
    int Year,
    string Developer,
    int Price,
    int DiscountPercent,
    int Rating,
    string CoverAlt,
    string Description,
    string[] Tags,
    string[]? Features);
