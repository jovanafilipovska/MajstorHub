using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Chatbot;

public class ChatbotMessageResponse
{
    public Guid Id { get; set; }
    public ChatbotMessageRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}