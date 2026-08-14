using MajstorHub.Api.DTOs.Messages;
using Microsoft.AspNetCore.Http;

namespace MajstorHub.Api.Services.Interfaces;

public interface IMessageService
{
    Task<MessageResponse> SendAsync(Guid senderId, SendMessageRequest request);
    Task<MessageResponse> SendPhotoAsync(Guid senderId, Guid bookingId, IFormFile file);
    Task<List<MessageResponse>> GetHistoryAsync(Guid bookingId, Guid requestingUserId);
    Task<List<ConversationSummaryResponse>> GetConversationsAsync(Guid userId);
    Task MarkReadAsync(Guid bookingId, Guid requestingUserId);
    Task DeleteConversationAsync(Guid bookingId, Guid requestingUserId);
}