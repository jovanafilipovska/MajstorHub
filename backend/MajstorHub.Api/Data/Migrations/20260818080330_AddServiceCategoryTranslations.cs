using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajstorHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCategoryTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_Name",
                table: "ServiceCategories");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ServiceCategories",
                newName: "NameSq");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "ServiceCategories",
                newName: "DescriptionSq");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "ServiceCategories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionMk",
                table: "ServiceCategories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "ServiceCategories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameMk",
                table: "ServiceCategories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DescriptionEn", "DescriptionMk", "DescriptionSq", "NameEn", "NameMk", "NameSq" },
                values: new object[] { "Electrical installation and repair", "Монтажа и поправка на електрична инсталација", "Instalim dhe riparim i instalimeve elektrike", "Electrician", "Електричар", "Elektricist" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DescriptionEn", "DescriptionMk", "DescriptionSq", "NameEn", "NameMk", "NameSq" },
                values: new object[] { "Plumbing installation and repair", "Монтажа и поправка на водоводна инсталација", "Instalim dhe riparim i instalimeve hidraulike", "Plumber", "Водоинсталатер", "Hidraulik" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DescriptionEn", "DescriptionMk", "DescriptionSq", "NameEn", "NameMk", "NameSq" },
                values: new object[] { "Woodwork and furniture", "Столарски работи и мебел", "Punime druri dhe mobilje", "Carpenter", "Столар", "Marangoz" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DescriptionEn", "DescriptionMk", "DescriptionSq", "NameEn", "NameMk", "NameSq" },
                values: new object[] { "Interior and exterior painting", "Молерисување - внатрешно и надворешно", "Lyerje e brendshme dhe e jashtme", "Painter", "Молер", "Bojaxhi" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DescriptionEn", "DescriptionMk", "DescriptionSq", "NameEn", "NameMk", "NameSq" },
                values: new object[] { "Home and office cleaning", "Чистење на дом и канцеларии", "Pastrim shtëpie dhe zyre", "Cleaner", "Чистач", "Pastrues" });

            // Any category beyond the 5 seeded ones (e.g. suggested via the app before this
            // migration) has no translation yet and got NameEn/NameMk defaulted to "" above -
            // fall back to its preserved original text (now in NameSq) so the new unique index
            // below doesn't collide on multiple blank NameEn values. The old schema already
            // enforced uniqueness on that original text, so this is guaranteed not to collide.
            migrationBuilder.Sql(
                "UPDATE \"ServiceCategories\" SET \"NameEn\" = \"NameSq\", \"NameMk\" = \"NameSq\" WHERE \"NameEn\" = '';");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_NameEn",
                table: "ServiceCategories",
                column: "NameEn",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_NameEn",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "DescriptionMk",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "NameMk",
                table: "ServiceCategories");

            migrationBuilder.RenameColumn(
                name: "NameSq",
                table: "ServiceCategories",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "DescriptionSq",
                table: "ServiceCategories",
                newName: "Description");

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Electrical installation and repair", "Electrician" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Plumbing installation and repair", "Plumber" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Woodwork and furniture", "Carpenter" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Interior and exterior painting", "Painter" });

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Home and office cleaning", "Cleaner" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_Name",
                table: "ServiceCategories",
                column: "Name",
                unique: true);
        }
    }
}
