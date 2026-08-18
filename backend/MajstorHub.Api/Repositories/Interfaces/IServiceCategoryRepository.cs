using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IServiceCategoryRepository : IRepository<ServiceCategory, int>
{
    /// <summary>Finds an existing category whose name in any language matches any of the given names (case-insensitive).</summary>
    Task<ServiceCategory?> FindByAnyNameAsync(string nameEn, string nameMk, string nameSq);
    Task<List<ServiceCategory>> GetApprovedAsync();
    Task<List<ServiceCategory>> GetPendingAsync();
}
