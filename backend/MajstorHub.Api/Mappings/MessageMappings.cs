using MajstorHub.Api.DTOs.Messages;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class MessageMappings
{
    public static MessageResponse ToResponse(this Message message)
    {
        return new MessageResponse
        {
            Id = message.Id,
            BookingId = message.BookingId,
            SenderId = message.SenderId,
            SenderName = message.Sender.FullName,
            SenderProfileImageUrl = message.Sender.ProfileImageUrl,
            Body = message.Body,
            PhotoUrl = message.PhotoUrl,
            CreatedAt = message.CreatedAt,
            ReadAt = message.ReadAt
        };
    }
}