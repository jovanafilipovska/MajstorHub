using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class ServiceCategoryRepository(MajstorHubDbContext context)
    : Repository<ServiceCategory, int>(context), IServiceCategoryRepository
{
    public async Task<ServiceCategory?> FindByAnyNameAsync(string nameEn, string nameMk, string nameSq)
    {
        var candidates = new[] { nameEn, nameMk, nameSq };
        var categories = await DbSet.ToListAsync();
        return categories.FirstOrDefault(c =>
            candidates.Any(candidate =>
                string.Equals(candidate, c.NameEn, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(candidate, c.NameMk, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(candidate, c.NameSq, StringComparison.OrdinalIgnoreCase)));
    }

    public async Task<List<ServiceCategory>> GetApprovedAsync()
    {
        return await DbSet.Where(c => c.IsApproved).ToListAsync();
    }

    public async Task<List<ServiceCategory>> GetPendingAsync()
    {
        return await DbSet.Where(c => !c.IsApproved).ToListAsync();
    }
}
