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
            ProfileImageUrl = profile.User.ProfileImageUrl,
            ServiceCategoryId = profile.ServiceCategoryId,
            ServiceCategoryName = profile.ServiceCategory.Name,
            BusinessName = profile.BusinessName,
            Bio = profile.Bio,
            HourlyRate = profile.HourlyRate,
            YearsOfExperience = profile.YearsOfExperience,
            Latitude = profile.Location?.Y,
            Longitude = profile.Location?.X,
            AddressText = profile.AddressText,
            IsAvailable = profile.IsAvailable,
            IsVerified = profile.IsVerified,
            ViewCount = profile.ViewCount,
            AverageRating = averageRating,
            ReviewCount = reviewCount,
            CreatedAt = profile.CreatedAt
        };
    }
}
