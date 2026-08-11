using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajstorHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressText",
                table: "Users",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressText",
                table: "Users");
        }
    }
}
