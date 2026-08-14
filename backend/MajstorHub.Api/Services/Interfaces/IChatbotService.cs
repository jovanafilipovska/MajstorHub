using MajstorHub.Api.DTOs.Chatbot;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Services.Interfaces;

public interface IChatbotService
{
    Task<ChatbotConversationResponse> GetConversationAsync(Guid userId, ChatbotMode mode);
    Task<ChatbotMessageResponse> SendMessageAsync(
        Guid userId, ChatbotMode mode, string message, double? latitude, double? longitude, CancellationToken ct = default);
    Task ResetConversationAsync(Guid userId, ChatbotMode mode);
}