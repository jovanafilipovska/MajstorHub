using System.ComponentModel.DataAnnotations.Schema;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Street { get; set; }
    public string? HouseNumber { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? ProfileImageUrl { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    [NotMapped]
    public string FullName => $"{FirstName} {LastName}".Trim();

    public CraftsmanProfile? CraftsmanProfile { get; set; }
    public ICollection<Booking> BookingsAsClient { get; set; } = new List<Booking>();
    public ICollection<Review> ReviewsWritten { get; set; } = new List<Review>();
}
