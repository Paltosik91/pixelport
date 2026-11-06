namespace PixelPort.Api.Data;

// Строка заказа: какая игра и по какой цене её купили
public class OrderLine
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    // Цена на момент покупки: скидка завтра изменится, а заплачено было столько
    public int Price { get; set; }
}
