using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.ServiceCategories;

public class CreateServiceCategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}
