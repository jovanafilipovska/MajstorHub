using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class BookingRepository(MajstorHubDbContext context) : Repository<Booking, Guid>(context), IBookingRepository
{
    private IQueryable<Booking> WithDetails() =>
        DbSet
            .Include(b => b.Client)
            .Include(b => b.CraftsmanProfile).ThenInclude(c => c.User)
            .Include(b => b.ServiceCategory)
            .Include(b => b.Review);

    public async Task<List<Booking>> GetByClientIdAsync(Guid clientId)
    {
        return await WithDetails().Where(b => b.ClientId == clientId).ToListAsync();
    }

    public async Task<List<Booking>> GetByCraftsmanProfileIdAsync(Guid craftsmanProfileId)
    {
        return await WithDetails().Where(b => b.CraftsmanProfileId == craftsmanProfileId).ToListAsync();
    }

    public async Task<Booking?> GetByIdWithDetailsAsync(Guid id)
    {
        return await WithDetails().FirstOrDefaultAsync(b => b.Id == id);
    }
}
