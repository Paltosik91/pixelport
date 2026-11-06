using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PixelPort.Api.Migrations
{
    /// <inheritdoc />
    public partial class RestrictGameWithReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_reviews_games_game_id",
                table: "reviews");

            migrationBuilder.AddForeignKey(
                name: "fk_reviews_games_game_id",
                table: "reviews",
                column: "game_id",
                principalTable: "games",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_reviews_games_game_id",
                table: "reviews");

            migrationBuilder.AddForeignKey(
                name: "fk_reviews_games_game_id",
                table: "reviews",
                column: "game_id",
                principalTable: "games",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
