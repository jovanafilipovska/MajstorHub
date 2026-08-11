using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajstorHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCategoryApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "ServiceCategories",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "SuggestedByUserId",
                table: "ServiceCategories",
                type: "uuid",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "IsApproved", "SuggestedByUserId" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "IsApproved", "SuggestedByUserId" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "IsApproved", "SuggestedByUserId" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "IsApproved", "SuggestedByUserId" },
                values: new object[] { true, null });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "IsApproved", "SuggestedByUserId" },
                values: new object[] { true, null });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_SuggestedByUserId",
                table: "ServiceCategories",
                column: "SuggestedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceCategories_Users_SuggestedByUserId",
                table: "ServiceCategories",
                column: "SuggestedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceCategories_Users_SuggestedByUserId",
                table: "ServiceCategories");

            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_SuggestedByUserId",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "SuggestedByUserId",
                table: "ServiceCategories");
        }
    }
}
