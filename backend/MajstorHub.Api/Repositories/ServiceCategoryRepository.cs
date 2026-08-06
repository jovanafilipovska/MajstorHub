using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class ServiceCategoryRepository(MajstorHubDbContext context)
    : Repository<ServiceCategory, int>(context), IServiceCategoryRepository
{
    public async Task<ServiceCategory?> GetByNameAsync(string name)
    {
        return await DbSet.FirstOrDefaultAsync(c => c.Name == name);
    }
}
