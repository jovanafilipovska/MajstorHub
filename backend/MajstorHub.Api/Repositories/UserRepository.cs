using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class UserRepository(MajstorHubDbContext context) : Repository<User, Guid>(context), IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await DbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await DbSet.AnyAsync(u => u.Email == email);
    }
}
