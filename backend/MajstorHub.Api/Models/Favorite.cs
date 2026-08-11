namespace MajstorHub.Api.Models;

public class Favorite
{
    public Guid Id { get; set; }
    public Guid ClientUserId { get; set; }
    public Guid CraftsmanProfileId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User ClientUser { get; set; } = null!;
    public CraftsmanProfile CraftsmanProfile { get; set; } = null!;
}