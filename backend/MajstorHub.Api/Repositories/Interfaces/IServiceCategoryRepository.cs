using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IServiceCategoryRepository : IRepository<ServiceCategory, int>
{
    Task<ServiceCategory?> GetByNameAsync(string name);
}
