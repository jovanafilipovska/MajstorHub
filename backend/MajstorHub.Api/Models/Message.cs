namespace MajstorHub.Api.Models;

public class Message
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid SenderId { get; set; }
    public string? Body { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }

    public Booking Booking { get; set; } = null!;
    public User Sender { get; set; } = null!;
}