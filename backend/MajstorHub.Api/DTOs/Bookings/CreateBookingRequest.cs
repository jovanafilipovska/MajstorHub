using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Bookings;

public class CreateBookingRequest
{
    [Required]
    public Guid CraftsmanProfileId { get; set; }

    [Required]
    public int ServiceCategoryId { get; set; }

    [Required, MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    public DateTimeOffset? ScheduledAt { get; set; }
}
