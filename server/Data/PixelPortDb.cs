using Microsoft.EntityFrameworkCore;

namespace PixelPort.Api.Data;

public class PixelPortDb(DbContextOptions<PixelPortDb> options) : DbContext(options)
{
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Tag> Tags => Set<Tag>();

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
                table.HasCheckConstraint("ck_games_rating", "rating BETWEEN 0 AND 100");
            });

            // Игры и теги: «многие ко многим» через таблицу game_tags
            game.HasMany(g => g.Tags)
                .WithMany(tag => tag.Games)
                .UsingEntity("game_tags");
        });
    }
}
