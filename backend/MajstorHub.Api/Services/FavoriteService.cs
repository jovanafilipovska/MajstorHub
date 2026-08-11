using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services;

public class FavoriteService(
    IFavoriteRepository favoriteRepository,
    ICraftsmanProfileRepository craftsmanProfileRepository,
    ICraftsmanProfileService craftsmanProfileService) : IFavoriteService
{
    public async Task AddAsync(Guid clientUserId, Guid craftsmanUserId)
    {
        if (clientUserId == craftsmanUserId)
        {
            throw new ValidationException("You cannot favorite yourself.");
        }

        _ = await craftsmanProfileRepository.GetByUserIdAsync(craftsmanUserId)
            ?? throw new NotFoundException($"Craftsman profile for user '{craftsmanUserId}' was not found.");

        if (await favoriteRepository.GetAsync(clientUserId, craftsmanUserId) is not null)
        {
            return;
        }

        await favoriteRepository.AddAsync(new Favorite
        {
            Id = Guid.NewGuid(),
            ClientUserId = clientUserId,
            CraftsmanProfileId = craftsmanUserId,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await favoriteRepository.SaveChangesAsync();
    }

    public async Task RemoveAsync(Guid clientUserId, Guid craftsmanUserId)
    {
        var favorite = await favoriteRepository.GetAsync(clientUserId, craftsmanUserId);
        if (favorite is null) return;

        favoriteRepository.Remove(favorite);
        await favoriteRepository.SaveChangesAsync();
    }

    public async Task<List<CraftsmanProfileResponse>> GetMyFavoritesAsync(Guid clientUserId)
    {
        var favorites = await favoriteRepository.GetByClientAsync(clientUserId);

        var results = new List<CraftsmanProfileResponse>();
        foreach (var favorite in favorites)
        {
            results.Add(await craftsmanProfileService.GetByIdAsync(favorite.CraftsmanProfileId));
        }
        return results;
    }
}