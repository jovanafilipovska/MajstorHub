using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Models;

public class ChatbotConversation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ChatbotMode Mode { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<ChatbotMessage> Messages { get; set; } = new List<ChatbotMessage>();
}