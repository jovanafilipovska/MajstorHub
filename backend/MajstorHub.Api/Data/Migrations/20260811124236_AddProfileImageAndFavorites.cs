using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajstorHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileImageAndFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CraftsmanProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favorites_CraftsmanProfiles_CraftsmanProfileId",
                        column: x => x.CraftsmanProfileId,
                        principalTable: "CraftsmanProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favorites_Users_ClientUserId",
                        column: x => x.ClientUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_ClientUserId_CraftsmanProfileId",
                table: "Favorites",
                columns: new[] { "ClientUserId", "CraftsmanProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_CraftsmanProfileId",
                table: "Favorites",
                column: "CraftsmanProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "Users");
        }
    }
}
