using MajstorHub.Api.DTOs.Messages;

namespace MajstorHub.Api.Services.Interfaces;

public interface IMessageService
{
    Task<MessageResponse> SendAsync(Guid senderId, SendMessageRequest request);
    Task<List<MessageResponse>> GetHistoryAsync(Guid bookingId, Guid requestingUserId);
    Task<List<ConversationSummaryResponse>> GetConversationsAsync(Guid userId);
    Task MarkReadAsync(Guid bookingId, Guid requestingUserId);
}