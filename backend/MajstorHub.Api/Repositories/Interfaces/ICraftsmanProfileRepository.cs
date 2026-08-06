using MajstorHub.Api.Models;
using NetTopologySuite.Geometries;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface ICraftsmanProfileRepository : IRepository<CraftsmanProfile, Guid>
{
    Task<CraftsmanProfile?> GetByUserIdAsync(Guid userId);
    Task<List<CraftsmanProfile>> GetByServiceCategoryAsync(int serviceCategoryId);
    Task<List<CraftsmanProfile>> GetNearbyAsync(Point origin, double radiusMeters);
}
