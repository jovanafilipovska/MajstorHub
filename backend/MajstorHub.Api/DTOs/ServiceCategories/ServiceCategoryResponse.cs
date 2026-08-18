namespace MajstorHub.Api.DTOs.ServiceCategories;

public class ServiceCategoryResponse
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameMk { get; set; } = string.Empty;
    public string NameSq { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionMk { get; set; }
    public string? DescriptionSq { get; set; }
    public bool IsApproved { get; set; }
}