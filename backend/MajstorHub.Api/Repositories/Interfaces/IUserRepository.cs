using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IUserRepository : IRepository<User, Guid>
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
}
