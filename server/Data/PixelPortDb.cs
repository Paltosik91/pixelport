using Microsoft.EntityFrameworkCore;

namespace PixelPort.Api.Data;

public class PixelPortDb(DbContextOptions<PixelPortDb> options) : DbContext(options)
{
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Genre>().HasIndex(genre => genre.Name).IsUnique();
        model.Entity<Tag>().HasIndex(tag => tag.Name).IsUnique();

        model.Entity<Game>(game =>
        {
            game.HasIndex(g => g.Slug).IsUnique();

            // Жанр с играми удалять нельзя — как в нашей схеме из №17
            game.HasOne(g => g.Genre)
                .WithMany(genre => genre.Games)
                .OnDelete(DeleteBehavior.Restrict);

            game.Property(g => g.FinalPrice)
                .HasComputedColumnSql("price * (100 - discount_percent) / 100", stored: true);

            game.ToTable(table =>
            {
                table.HasCheckConstraint("ck_games_price", "price >= 0");
                table.HasCheckConstraint("ck_games_discount", "discount_percent BETWEEN 0 AND 90");
            });

            // Игры и теги: «многие ко многим» через таблицу game_tags
            game.HasMany(g => g.Tags)
                .WithMany(tag => tag.Games)
                .UsingEntity("game_tags");
        });

        model.Entity<Player>().HasIndex(player => player.Nickname).IsUnique();

        model.Entity<Review>(review =>
        {
            // Один игрок — один отзыв на игру
            review.HasIndex(r => new { r.GameId, r.PlayerId }).IsUnique();
            review.Property(r => r.Text).HasMaxLength(1000);
            review.Property(r => r.CreatedAt).HasDefaultValueSql("now()");

            // Игру с отзывами удалить нельзя: отзывы — история, а не мусор
            review.HasOne(r => r.Game)
                .WithMany(game => game.Reviews)
                .OnDelete(DeleteBehavior.Restrict);
        });

        model.Entity<Order>(order =>
        {
            order.Property(o => o.CreatedAt).HasDefaultValueSql("now()");
            order.Property(o => o.PromoCode).HasMaxLength(20);
            order.ToTable(table => table.HasCheckConstraint("ck_orders_total", "total >= 0"));
        });

        model.Entity<OrderLine>(line =>
        {
            // Одна игра — одна строка заказа: составной первичный ключ
            line.HasKey(l => new { l.OrderId, l.GameId });

            // Купленную игру удалить нельзя: она в чьей-то библиотеке
            line.HasOne(l => l.Game)
                .WithMany()
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
