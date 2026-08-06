using NetTopologySuite.Geometries;

namespace MajstorHub.Api.Models;

public class CraftsmanProfile
{
    public Guid UserId { get; set; }
    public int ServiceCategoryId { get; set; }
    public string? Bio { get; set; }
    public decimal HourlyRate { get; set; }
    public int? YearsOfExperience { get; set; }
    public Point? Location { get; set; }
    public string? AddressText { get; set; }
    public bool IsAvailable { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ServiceCategory ServiceCategory { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
