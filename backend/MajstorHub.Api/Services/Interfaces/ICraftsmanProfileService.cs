using MajstorHub.Api.DTOs.Craftsmen;

namespace MajstorHub.Api.Services.Interfaces;

public interface ICraftsmanProfileService
{
    Task<CraftsmanProfileResponse> CreateAsync(Guid userId, CreateCraftsmanProfileRequest request);
    Task<CraftsmanProfileResponse> GetByIdAsync(Guid userId);
    Task<List<CraftsmanProfileResponse>> GetByCategoryAsync(int categoryId);
    Task<CraftsmanProfileResponse> UpdateAsync(Guid userId, UpdateCraftsmanProfileRequest request);
    Task<List<CraftsmanProfileResponse>> SearchNearbyAsync(double latitude, double longitude, double radiusKm);
}
