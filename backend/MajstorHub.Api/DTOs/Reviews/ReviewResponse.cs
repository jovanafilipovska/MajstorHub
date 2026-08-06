namespace MajstorHub.Api.DTOs.Reviews;

public class ReviewResponse
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public Guid CraftsmanProfileId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
