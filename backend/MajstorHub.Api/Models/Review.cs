namespace MajstorHub.Api.Models;

public class Review
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid ReviewerId { get; set; }
    public Guid CraftsmanProfileId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Booking Booking { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
    public CraftsmanProfile CraftsmanProfile { get; set; } = null!;
}
