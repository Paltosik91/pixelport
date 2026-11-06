namespace PixelPort.Api.Data;

public class Review
{
    public int Id { get; set; }
    public bool IsRecommended { get; set; }
    public required string Text { get; set; }
    public DateTime CreatedAt { get; set; }

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;
}
