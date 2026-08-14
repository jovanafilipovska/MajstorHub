using MajstorHub.Api.DTOs.Messages;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Hubs;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;

namespace MajstorHub.Api.Services;

public class MessageService(
    IMessageRepository messageRepository,
    IBookingRepository bookingRepository,
    IHubContext<ChatHub> hubContext,
    IWebHostEnvironment webHostEnvironment) : IMessageService
{
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png"];

    public async Task<MessageResponse> SendAsync(Guid senderId, SendMessageRequest request)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId)
            ?? throw new NotFoundException($"Booking '{request.BookingId}' was not found.");

        if (senderId != booking.ClientId && senderId != booking.CraftsmanProfileId)
        {
            throw new ForbiddenException("You are not a participant in this booking.");
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            SenderId = senderId,
            Body = request.Body,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await messageRepository.AddAsync(message);
        await messageRepository.SaveChangesAsync();

        message.Sender = senderId == booking.ClientId ? booking.Client : booking.CraftsmanProfile.User;
        var response = message.ToResponse();

        var recipientId = senderId == booking.ClientId ? booking.CraftsmanProfileId : booking.ClientId;
        await hubContext.Clients.User(recipientId.ToString()).SendAsync("ReceiveMessage", response);
        await hubContext.Clients.User(senderId.ToString()).SendAsync("ReceiveMessage", response);

        return response;
    }

    public async Task<MessageResponse> SendPhotoAsync(Guid senderId, Guid bookingId, IFormFile file)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(bookingId)
            ?? throw new NotFoundException($"Booking '{bookingId}' was not found.");

        if (senderId != booking.ClientId && senderId != booking.CraftsmanProfileId)
        {
            throw new ForbiddenException("You are not a participant in this booking.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedImageExtensions.Contains(extension))
        {
            throw new ValidationException("Only JPG and PNG images are supported.");
        }

        var uploadsPath = Path.Combine(webHostEnvironment.ContentRootPath, "Uploads", "messages", bookingId.ToString());
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            SenderId = senderId,
            PhotoUrl = $"/uploads/messages/{bookingId}/{fileName}",
            CreatedAt = DateTimeOffset.UtcNow
        };

        await messageRepository.AddAsync(message);
        await messageRepository.SaveChangesAsync();

        message.Sender = senderId == booking.ClientId ? booking.Client : booking.CraftsmanProfile.User;
        var response = message.ToResponse();

        var recipientId = senderId == booking.ClientId ? booking.CraftsmanProfileId : booking.ClientId;
        await hubContext.Clients.User(recipientId.ToString()).SendAsync("ReceiveMessage", response);
        await hubContext.Clients.User(senderId.ToString()).SendAsync("ReceiveMessage", response);

        return response;
    }

    public async Task<List<MessageResponse>> GetHistoryAsync(Guid bookingId, Guid requestingUserId)
    {
        await GetOwnedBookingAsync(bookingId, requestingUserId);
        var messages = await messageRepository.GetByBookingIdAsync(bookingId);
        return messages.Select(m => m.ToResponse()).ToList();
    }

    public async Task<List<ConversationSummaryResponse>> GetConversationsAsync(Guid userId)
    {
        var asClient = await bookingRepository.GetByClientIdAsync(userId);
        var asCraftsman = await bookingRepository.GetByCraftsmanProfileIdAsync(userId);
        var bookings = asClient.Concat(asCraftsman).ToList();

        var summaries = new List<ConversationSummaryResponse>();
        foreach (var booking in bookings)
        {
            var last = await messageRepository.GetLastForBookingAsync(booking.Id);
            if (last is null)
            {
                continue;
            }

            var unread = await messageRepository.GetUnreadCountAsync(booking.Id, userId);
            var isClient = userId == booking.ClientId;

            summaries.Add(new ConversationSummaryResponse
            {
                BookingId = booking.Id,
                BookingStatus = booking.Status,
                ServiceCategoryName = booking.ServiceCategory.Name,
                OtherPartyId = isClient ? booking.CraftsmanProfileId : booking.ClientId,
                OtherPartyName = isClient ? booking.CraftsmanProfile.User.FullName : booking.Client.FullName,
                OtherPartyProfileImageUrl = isClient ? booking.CraftsmanProfile.User.ProfileImageUrl : booking.Client.ProfileImageUrl,
                LastMessagePreview = last.Body != null && last.Body.Length > 80 ? last.Body[..80] + "…" : last.Body,
                LastMessageAt = last.CreatedAt,
                LastMessageSenderId = last.SenderId,
                LastMessageIsPhoto = last.PhotoUrl != null,
                UnreadCount = unread
            });
        }

        return summaries.OrderByDescending(s => s.LastMessageAt).ToList();
    }

    public async Task MarkReadAsync(Guid bookingId, Guid requestingUserId)
    {
        var booking = await GetOwnedBookingAsync(bookingId, requestingUserId);
        var markedCount = await messageRepository.MarkAllReadAsync(bookingId, requestingUserId);

        if (markedCount > 0)
        {
            var otherPartyId = requestingUserId == booking.ClientId ? booking.CraftsmanProfileId : booking.ClientId;
            await hubContext.Clients.User(otherPartyId.ToString())
                .SendAsync("MessagesRead", new { bookingId, readAt = DateTimeOffset.UtcNow });
        }
    }

    public async Task DeleteConversationAsync(Guid bookingId, Guid requestingUserId)
    {
        var booking = await GetOwnedBookingAsync(bookingId, requestingUserId);
        await messageRepository.DeleteAllForBookingAsync(bookingId);

        var otherPartyId = requestingUserId == booking.ClientId ? booking.CraftsmanProfileId : booking.ClientId;
        await hubContext.Clients.User(otherPartyId.ToString()).SendAsync("ConversationDeleted", new { bookingId });
    }

    private async Task<Booking> GetOwnedBookingAsync(Guid bookingId, Guid requestingUserId)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(bookingId)
            ?? throw new NotFoundException($"Booking '{bookingId}' was not found.");

        if (requestingUserId != booking.ClientId && requestingUserId != booking.CraftsmanProfileId)
        {
            throw new ForbiddenException("You are not a participant in this booking.");
        }

        return booking;
    }
}