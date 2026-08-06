using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class CraftsmanProfileMappings
{
    public static CraftsmanProfileResponse ToResponse(this CraftsmanProfile profile, double? averageRating, int reviewCount)
    {
        return new CraftsmanProfileResponse
        {
            UserId = profile.UserId,
            FullName = profile.User.FullName,
            ServiceCategoryId = profile.ServiceCategoryId,
            ServiceCategoryName = profile.ServiceCategory.Name,
            Bio = profile.Bio,
            HourlyRate = profile.HourlyRate,
            YearsOfExperience = profile.YearsOfExperience,
            Latitude = profile.Location?.Y,
            Longitude = profile.Location?.X,
            AddressText = profile.AddressText,
            IsAvailable = profile.IsAvailable,
            AverageRating = averageRating,
            ReviewCount = reviewCount
        };
    }
}
