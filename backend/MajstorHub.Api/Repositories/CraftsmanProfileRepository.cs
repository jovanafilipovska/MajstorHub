using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace MajstorHub.Api.Repositories;

public class CraftsmanProfileRepository(MajstorHubDbContext context)
    : Repository<CraftsmanProfile, Guid>(context), ICraftsmanProfileRepository
{
    public async Task<CraftsmanProfile?> GetByUserIdAsync(Guid userId)
    {
        return await DbSet
            .Include(c => c.User)
            .Include(c => c.ServiceCategory)
            .FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task<List<CraftsmanProfile>> GetAllWithDetailsAsync()
    {
        return await DbSet
            .Include(c => c.User)
            .Include(c => c.ServiceCategory)
            .ToListAsync();
    }

    public async Task<List<CraftsmanProfile>> GetByServiceCategoryAsync(int serviceCategoryId)
    {
        return await DbSet
            .Include(c => c.User)
            .Include(c => c.ServiceCategory)
            .Where(c => c.ServiceCategoryId == serviceCategoryId)
            .ToListAsync();
    }

    public async Task<List<CraftsmanProfile>> GetNearbyAsync(Point origin, double radiusMeters)
    {
        return await DbSet
            .Include(c => c.User)
            .Include(c => c.ServiceCategory)
            .Where(c => c.Location != null && c.Location.Distance(origin) <= radiusMeters)
            .OrderBy(c => c.Location!.Distance(origin))
            .ToListAsync();
    }
}
