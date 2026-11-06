namespace PixelPort.Api.Data;

public class Game
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public required string Developer { get; set; }
    public int ReleaseYear { get; set; }
    public int Price { get; set; }
    public int DiscountPercent { get; set; }
    public int FinalPrice { get; private set; }
    public int Rating { get; set; }
    public required string CoverAlt { get; set; }
    public required string Description { get; set; }
    public List<string>? Features { get; set; }

    public int GenreId { get; set; }
    public Genre Genre { get; set; } = null!;

    public List<Tag> Tags { get; set; } = [];
}
