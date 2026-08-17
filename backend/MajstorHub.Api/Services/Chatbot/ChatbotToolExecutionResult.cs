using MajstorHub.Api.DTOs.Craftsmen;

namespace MajstorHub.Api.Services.Chatbot;

// ForModel is JSON-serialized back to Groq as the tool's result. Suggestions
// carries the same craftsmen as real DTOs (with UserId) for the API caller to
// render as tappable profile cards - the model never sees this list directly.
public record ChatbotToolExecutionResult(object ForModel, List<CraftsmanProfileResponse>? Suggestions = null);
