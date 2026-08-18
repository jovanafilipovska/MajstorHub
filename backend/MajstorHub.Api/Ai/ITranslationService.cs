namespace MajstorHub.Api.Ai;

public record CategoryTranslation(string NameEn, string NameMk, string NameSq, string? DescriptionEn, string? DescriptionMk, string? DescriptionSq);

public interface ITranslationService
{
    /// <summary>
    /// Detects the source language of the given category name/description (whichever
    /// the admin or craftsman typed it in) and returns English, Macedonian, and
    /// Albanian versions of both.
    /// </summary>
    Task<CategoryTranslation> TranslateCategoryAsync(string name, string? description, CancellationToken ct = default);
}