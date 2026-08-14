using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class ChatbotRepository(MajstorHubDbContext context)
    : Repository<ChatbotConversation, Guid>(context), IChatbotRepository
{
    public async Task<ChatbotConversation?> GetConversationWithMessagesAsync(Guid userId, ChatbotMode mode)
    {
        return await DbSet
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Mode == mode);
    }

    public async Task AddMessageAsync(ChatbotMessage message)
    {
        await Context.ChatbotMessages.AddAsync(message);
    }

    public async Task ClearMessagesAsync(Guid conversationId)
    {
        await Context.ChatbotMessages.Where(m => m.ConversationId == conversationId).ExecuteDeleteAsync();
    }
}