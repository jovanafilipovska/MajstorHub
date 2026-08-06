using MajstorHub.Api.Data;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class Repository<TEntity, TKey>(MajstorHubDbContext context) : IRepository<TEntity, TKey>
    where TEntity : class
{
    protected readonly MajstorHubDbContext Context = context;
    protected readonly DbSet<TEntity> DbSet = context.Set<TEntity>();

    public virtual async Task<TEntity?> GetByIdAsync(TKey id)
    {
        return await DbSet.FindAsync(id);
    }

    public async Task<List<TEntity>> GetAllAsync()
    {
        return await DbSet.ToListAsync();
    }

    public async Task AddAsync(TEntity entity)
    {
        await DbSet.AddAsync(entity);
    }

    public void Update(TEntity entity)
    {
        DbSet.Update(entity);
    }

    public void Remove(TEntity entity)
    {
        DbSet.Remove(entity);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await Context.SaveChangesAsync();
    }
}
