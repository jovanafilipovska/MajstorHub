using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Chatbot;

public class ChatbotMessageResponse
{
    public Guid Id { get; set; }
    public ChatbotMessageRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    // Craftsmen surfaced by search_craftsmen/get_my_favorites during this turn,
    // so the client can render tappable profile cards. Not persisted - only
    // populated on the live response for the turn that produced them.
    public List<CraftsmanProfileResponse>? Suggestions { get; set; }
}