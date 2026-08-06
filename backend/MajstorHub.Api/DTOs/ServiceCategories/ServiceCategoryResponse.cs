namespace MajstorHub.Api.DTOs.ServiceCategories;

public class ServiceCategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
