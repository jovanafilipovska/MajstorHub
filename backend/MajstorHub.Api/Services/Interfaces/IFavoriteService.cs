using MajstorHub.Api.DTOs.Craftsmen;

namespace MajstorHub.Api.Services.Interfaces;

public interface IFavoriteService
{
    Task AddAsync(Guid clientUserId, Guid craftsmanUserId);
    Task RemoveAsync(Guid clientUserId, Guid craftsmanUserId);
    Task<List<CraftsmanProfileResponse>> GetMyFavoritesAsync(Guid clientUserId);
}