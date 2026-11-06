namespace PixelPort.Api.Data;

// Заказ: кто, когда и сколько заплатил
public class Order
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? PromoCode { get; set; }
    public int Total { get; set; }

    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public List<OrderLine> Lines { get; set; } = [];
}
