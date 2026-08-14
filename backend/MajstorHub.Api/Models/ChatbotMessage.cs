using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Models;

public class ChatbotMessage
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public ChatbotMessageRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    public ChatbotConversation Conversation { get; set; } = null!;
}