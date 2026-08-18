using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Bookings;

public class BookingResponse
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientProfileImageUrl { get; set; }
    public Guid CraftsmanProfileId { get; set; }
    public string CraftsmanName { get; set; } = string.Empty;
    public string? CraftsmanProfileImageUrl { get; set; }
    public int ServiceCategoryId { get; set; }
    public string ServiceCategoryNameEn { get; set; } = string.Empty;
    public string ServiceCategoryNameMk { get; set; } = string.Empty;
    public string ServiceCategoryNameSq { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<string> PhotoUrls { get; set; } = new();
    public DateTimeOffset? ScheduledAt { get; set; }
    public BookingStatus Status { get; set; }
    public decimal? PriceQuote { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool HasReview { get; set; }
}
