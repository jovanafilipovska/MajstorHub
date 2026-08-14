using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IChatbotRepository : IRepository<ChatbotConversation, Guid>
{
    Task<ChatbotConversation?> GetConversationWithMessagesAsync(Guid userId, ChatbotMode mode);
    Task AddMessageAsync(ChatbotMessage message);
    Task ClearMessagesAsync(Guid conversationId);
}