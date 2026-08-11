namespace MajstorHub.Api.Models;

public class ServiceCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsApproved { get; set; } = true;
    public Guid? SuggestedByUserId { get; set; }

    public User? SuggestedByUser { get; set; }
    public ICollection<CraftsmanProfile> CraftsmanProfiles { get; set; } = new List<CraftsmanProfile>();
}
