using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Chatbot;

public class SendChatbotMessageRequest
{
    public ChatbotMode Mode { get; set; }
    public string Message { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}