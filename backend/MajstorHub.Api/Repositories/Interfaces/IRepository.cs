namespace MajstorHub.Api.Repositories.Interfaces;

public interface IRepository<TEntity, in TKey> where TEntity : class
{
    Task<TEntity?> GetByIdAsync(TKey id);
    Task<List<TEntity>> GetAllAsync();
    Task AddAsync(TEntity entity);
    void Update(TEntity entity);
    void Remove(TEntity entity);
    Task<int> SaveChangesAsync();
}
