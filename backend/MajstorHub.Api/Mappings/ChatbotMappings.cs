using MajstorHub.Api.DTOs.Chatbot;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class ChatbotMappings
{
    public static ChatbotMessageResponse ToResponse(this ChatbotMessage message)
    {
        return new ChatbotMessageResponse
        {
            Id = message.Id,
            Role = message.Role,
            Content = message.Content,
            CreatedAt = message.CreatedAt
        };
    }
}