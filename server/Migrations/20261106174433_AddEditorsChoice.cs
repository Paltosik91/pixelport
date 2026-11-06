using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PixelPort.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEditorsChoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_editors_choice",
                table: "games",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // В новой базе выбор редакции проставит сидер из catalog.json,
            // а в уже заполненной — эта команда
            migrationBuilder.Sql(
                "UPDATE games SET is_editors_choice = true " +
                "WHERE slug IN ('iron-harbor', 'lantern-valley', 'hollow-bell');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_editors_choice",
                table: "games");
        }
    }
}
