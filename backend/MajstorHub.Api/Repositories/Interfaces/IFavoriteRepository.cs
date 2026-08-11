using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IFavoriteRepository : IRepository<Favorite, Guid>
{
    Task<Favorite?> GetAsync(Guid clientUserId, Guid craftsmanUserId);
    Task<List<Favorite>> GetByClientAsync(Guid clientUserId);
}