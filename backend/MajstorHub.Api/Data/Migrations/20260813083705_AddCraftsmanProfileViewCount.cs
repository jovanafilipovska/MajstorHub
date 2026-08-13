using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajstorHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCraftsmanProfileViewCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "CraftsmanProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "CraftsmanProfiles");
        }
    }
}
