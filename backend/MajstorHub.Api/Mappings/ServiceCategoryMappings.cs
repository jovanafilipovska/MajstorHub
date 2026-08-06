using MajstorHub.Api.DTOs.ServiceCategories;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class ServiceCategoryMappings
{
    public static ServiceCategoryResponse ToResponse(this ServiceCategory category)
    {
        return new ServiceCategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }
}
