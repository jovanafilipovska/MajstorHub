using MajstorHub.Api.Common;
using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services;

public class CraftsmanProfileService(
    ICraftsmanProfileRepository craftsmanProfileRepository,
    IUserRepository userRepository,
    IReviewRepository reviewRepository) : ICraftsmanProfileService
{
    public async Task<CraftsmanProfileResponse> CreateAsync(Guid userId, CreateCraftsmanProfileRequest request)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException($"User '{userId}' was not found.");

        if (user.Role != UserRole.Craftsman)
        {
            throw new ValidationException("Only users with the Craftsman role can create a craftsman profile.");
        }

        if (await craftsmanProfileRepository.GetByUserIdAsync(userId) is not null)
        {
            throw new ConflictException("A craftsman profile already exists for this user.");
        }

        var profile = new CraftsmanProfile
        {
            UserId = userId,
            ServiceCategoryId = request.ServiceCategoryId,
            Bio = request.Bio,
            HourlyRate = request.HourlyRate,
            YearsOfExperience = request.YearsOfExperience,
            Location = BuildLocation(request.Latitude, request.Longitude),
            AddressText = request.AddressText,
            IsAvailable = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await craftsmanProfileRepository.AddAsync(profile);
        await craftsmanProfileRepository.SaveChangesAsync();

        return await GetByIdAsync(userId);
    }

    public async Task<CraftsmanProfileResponse> GetByIdAsync(Guid userId)
    {
        var profile = await craftsmanProfileRepository.GetByUserIdAsync(userId)
            ?? throw new NotFoundException($"Craftsman profile for user '{userId}' was not found.");

        var (averageRating, reviewCount) = await GetRatingStatsAsync(userId);
        return profile.ToResponse(averageRating, reviewCount);
    }

    public async Task<List<CraftsmanProfileResponse>> GetByCategoryAsync(int categoryId)
    {
        var profiles = await craftsmanProfileRepository.GetByServiceCategoryAsync(categoryId);
        return await MapWithRatingsAsync(profiles);
    }

    public async Task<CraftsmanProfileResponse> UpdateAsync(Guid userId, UpdateCraftsmanProfileRequest request)
    {
        var profile = await craftsmanProfileRepository.GetByUserIdAsync(userId)
            ?? throw new NotFoundException($"Craftsman profile for user '{userId}' was not found.");

        if (request.ServiceCategoryId is not null) profile.ServiceCategoryId = request.ServiceCategoryId.Value;
        if (request.Bio is not null) profile.Bio = request.Bio;
        if (request.HourlyRate is not null) profile.HourlyRate = request.HourlyRate.Value;
        if (request.YearsOfExperience is not null) profile.YearsOfExperience = request.YearsOfExperience;
        if (request.AddressText is not null) profile.AddressText = request.AddressText;
        if (request.IsAvailable is not null) profile.IsAvailable = request.IsAvailable.Value;
        if (request.Latitude is not null && request.Longitude is not null)
        {
            profile.Location = GeoHelper.CreatePoint(request.Latitude.Value, request.Longitude.Value);
        }
        profile.UpdatedAt = DateTimeOffset.UtcNow;

        craftsmanProfileRepository.Update(profile);
        await craftsmanProfileRepository.SaveChangesAsync();

        return await GetByIdAsync(userId);
    }

    public async Task<List<CraftsmanProfileResponse>> SearchNearbyAsync(double latitude, double longitude, double radiusKm)
    {
        var origin = GeoHelper.CreatePoint(latitude, longitude);
        var profiles = await craftsmanProfileRepository.GetNearbyAsync(origin, radiusKm * 1000);
        return await MapWithRatingsAsync(profiles);
    }

    private async Task<List<CraftsmanProfileResponse>> MapWithRatingsAsync(List<CraftsmanProfile> profiles)
    {
        var results = new List<CraftsmanProfileResponse>();
        foreach (var profile in profiles)
        {
            var (averageRating, reviewCount) = await GetRatingStatsAsync(profile.UserId);
            results.Add(profile.ToResponse(averageRating, reviewCount));
        }
        return results;
    }

    private async Task<(double? AverageRating, int ReviewCount)> GetRatingStatsAsync(Guid craftsmanProfileId)
    {
        var reviews = await reviewRepository.GetByCraftsmanProfileIdAsync(craftsmanProfileId);
        if (reviews.Count == 0) return (null, 0);
        return (reviews.Average(r => r.Rating), reviews.Count);
    }

    private static NetTopologySuite.Geometries.Point? BuildLocation(double? latitude, double? longitude)
    {
        return latitude is not null && longitude is not null
            ? GeoHelper.CreatePoint(latitude.Value, longitude.Value)
            : null;
    }
}
