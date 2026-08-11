using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class FavoriteRepository(MajstorHubDbContext context)
    : Repository<Favorite, Guid>(context), IFavoriteRepository
{
    public async Task<Favorite?> GetAsync(Guid clientUserId, Guid craftsmanUserId)
    {
        return await DbSet.FirstOrDefaultAsync(
            f => f.ClientUserId == clientUserId && f.CraftsmanProfileId == craftsmanUserId);
    }

    public async Task<List<Favorite>> GetByClientAsync(Guid clientUserId)
    {
        return await DbSet.Where(f => f.ClientUserId == clientUserId).ToListAsync();
    }
}