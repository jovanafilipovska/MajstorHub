namespace MajstorHub.Api.Models;

public class ServiceCategory
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameMk { get; set; } = string.Empty;
    public string NameSq { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionMk { get; set; }
    public string? DescriptionSq { get; set; }
    public bool IsApproved { get; set; } = true;
    public Guid? SuggestedByUserId { get; set; }

    public User? SuggestedByUser { get; set; }
    public ICollection<CraftsmanProfile> CraftsmanProfiles { get; set; } = new List<CraftsmanProfile>();
}
