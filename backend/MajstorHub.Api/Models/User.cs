using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public CraftsmanProfile? CraftsmanProfile { get; set; }
    public ICollection<Booking> BookingsAsClient { get; set; } = new List<Booking>();
    public ICollection<Review> ReviewsWritten { get; set; } = new List<Review>();
}
