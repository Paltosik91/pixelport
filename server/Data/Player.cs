namespace PixelPort.Api.Data;

public class Player
{
    public int Id { get; set; }
    public required string Nickname { get; set; }
    public required string AvatarUrl { get; set; }

    public List<Review> Reviews { get; set; } = [];
}
