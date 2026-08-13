namespace MajstorHub.Api.DTOs.Messages;

public class MessageResponse
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}