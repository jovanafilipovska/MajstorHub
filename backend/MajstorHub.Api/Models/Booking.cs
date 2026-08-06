using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Models;

public class Booking
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid CraftsmanProfileId { get; set; }
    public int ServiceCategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTimeOffset? ScheduledAt { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public decimal? PriceQuote { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User Client { get; set; } = null!;
    public CraftsmanProfile CraftsmanProfile { get; set; } = null!;
    public ServiceCategory ServiceCategory { get; set; } = null!;
    public Review? Review { get; set; }
}
