using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Bookings;

public class BookingResponse
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public Guid CraftsmanProfileId { get; set; }
    public string CraftsmanName { get; set; } = string.Empty;
    public string ServiceCategoryName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTimeOffset? ScheduledAt { get; set; }
    public BookingStatus Status { get; set; }
    public decimal? PriceQuote { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
