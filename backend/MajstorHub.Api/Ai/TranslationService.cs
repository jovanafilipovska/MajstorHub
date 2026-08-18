using System.Text.Json;
using System.Text.Json.Serialization;

namespace MajstorHub.Api.Ai;

public class TranslationService(IGroqClient groqClient) : ITranslationService
{
    private const string SystemPrompt =
        "You translate short craft/trade service-category names and descriptions for a home-services app. " +
        "Detect the language the input is written in, then produce English, Macedonian, and Albanian versions of " +
        "both fields - including for whichever language it was already written in (use the original text as-is " +
        "for that one language, don't paraphrase it). Keep translations short and natural, matching the tone of a " +
        "simple category label. " +
        "CRITICAL: nameMk/descriptionMk MUST be written in Macedonian using Cyrillic script, and nameSq/descriptionSq " +
        "MUST be written in Albanian using Latin script - never put Albanian text in the Mk field or vice versa. " +
        "Example input {\"name\":\"Cleaning\",\"description\":\"House keeping and cleaning\"} must produce exactly: " +
        "{\"nameEn\":\"Cleaning\",\"nameMk\":\"Чистење\",\"nameSq\":\"Pastrimi\"," +
        "\"descriptionEn\":\"House keeping and cleaning\",\"descriptionMk\":\"Одржување на домаќинство и чистење\"," +
        "\"descriptionSq\":\"Mirëmbajtje shtëpiake dhe pastrim\"}. " +
        "Respond with ONLY strict JSON, no markdown fences, no commentary, in exactly this shape: " +
        "{\"nameEn\":\"...\",\"nameMk\":\"...\",\"nameSq\":\"...\",\"descriptionEn\":\"...\"|null,\"descriptionMk\":\"...\"|null,\"descriptionSq\":\"...\"|null}. " +
        "If no description was given in the input, use null for all three description fields.";

    public async Task<CategoryTranslation> TranslateCategoryAsync(string name, string? description, CancellationToken ct = default)
    {
        var userPayload = JsonSerializer.Serialize(new { name, description });

        try
        {
            var result = await groqClient.CompleteAsync(
                new List<GroqMessage>
                {
                    new() { Role = "system", Content = SystemPrompt },
                    new() { Role = "user", Content = userPayload }
                },
                new List<GroqToolDefinition>(),
                ct);

            var content = ExtractJson(result.Content);
            if (content is null)
            {
                return Fallback(name, description);
            }

            var parsed = JsonSerializer.Deserialize<TranslationResponse>(content, JsonOptions);
            if (parsed is null || string.IsNullOrWhiteSpace(parsed.NameEn) || string.IsNullOrWhiteSpace(parsed.NameMk) || string.IsNullOrWhiteSpace(parsed.NameSq))
            {
                return Fallback(name, description);
            }

            // The model occasionally mixes up which language slot text goes into (e.g. Albanian
            // text landing in the Macedonian field). Macedonian is always Cyrillic, so a Mk field
            // with no Cyrillic characters at all is a reliable signal something went wrong -
            // safer to fall back to the original text everywhere than store mislabeled text.
            if (!ContainsCyrillic(parsed.NameMk) || (parsed.DescriptionMk is { Length: > 0 } && !ContainsCyrillic(parsed.DescriptionMk)))
            {
                return Fallback(name, description);
            }

            return new CategoryTranslation(
                parsed.NameEn.Trim(),
                parsed.NameMk.Trim(),
                parsed.NameSq.Trim(),
                parsed.DescriptionEn?.Trim(),
                parsed.DescriptionMk?.Trim(),
                parsed.DescriptionSq?.Trim());
        }
        catch (Exception) when (ct.IsCancellationRequested is false)
        {
            // Translation is a nice-to-have, not worth blocking category creation over -
            // fall back to the original text in all three fields; an admin can fix the
            // other two languages later via the edit flow.
            return Fallback(name, description);
        }
    }

    private static CategoryTranslation Fallback(string name, string? description) =>
        new(name, name, name, description, description, description);

    private static bool ContainsCyrillic(string text) => text.Any(c => c is >= 'Ѐ' and <= 'ӿ');

    private static string? ExtractJson(string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var trimmed = content.Trim();

        // Some models wrap JSON in a ```json ... ``` fence despite instructions not to.
        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            var lastFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (firstNewline >= 0 && lastFence > firstNewline)
            {
                trimmed = trimmed[(firstNewline + 1)..lastFence].Trim();
            }
        }

        return trimmed;
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private class TranslationResponse
    {
        [JsonPropertyName("nameEn")]
        public string? NameEn { get; set; }

        [JsonPropertyName("nameMk")]
        public string? NameMk { get; set; }

        [JsonPropertyName("nameSq")]
        public string? NameSq { get; set; }

        [JsonPropertyName("descriptionEn")]
        public string? DescriptionEn { get; set; }

        [JsonPropertyName("descriptionMk")]
        public string? DescriptionMk { get; set; }

        [JsonPropertyName("descriptionSq")]
        public string? DescriptionSq { get; set; }
    }
}