using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Messages;

public class ConversationSummaryResponse
{
    public Guid BookingId { get; set; }
    public BookingStatus BookingStatus { get; set; }
    public string ServiceCategoryName { get; set; } = string.Empty;
    public Guid OtherPartyId { get; set; }
    public string OtherPartyName { get; set; } = string.Empty;
    public string? OtherPartyProfileImageUrl { get; set; }
    public string? LastMessagePreview { get; set; }
    public DateTimeOffset? LastMessageAt { get; set; }
    public Guid? LastMessageSenderId { get; set; }
    public bool LastMessageIsPhoto { get; set; }
    public int UnreadCount { get; set; }
}