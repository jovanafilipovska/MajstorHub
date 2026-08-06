using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.ServiceCategories;

public class UpdateServiceCategoryRequest
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }
}
