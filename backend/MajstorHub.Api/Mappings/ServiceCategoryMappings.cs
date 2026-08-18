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
            NameEn = category.NameEn,
            NameMk = category.NameMk,
            NameSq = category.NameSq,
            DescriptionEn = category.DescriptionEn,
            DescriptionMk = category.DescriptionMk,
            DescriptionSq = category.DescriptionSq,
            IsApproved = category.IsApproved
        };
    }
}
