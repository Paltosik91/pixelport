using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PixelPort.Api.Migrations
{
    /// <inheritdoc />
    public partial class RestrictGenreDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_games_genres_genre_id",
                table: "games");

            migrationBuilder.AddForeignKey(
                name: "fk_games_genres_genre_id",
                table: "games",
                column: "genre_id",
                principalTable: "genres",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_games_genres_genre_id",
                table: "games");

            migrationBuilder.AddForeignKey(
                name: "fk_games_genres_genre_id",
                table: "games",
                column: "genre_id",
                principalTable: "genres",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
