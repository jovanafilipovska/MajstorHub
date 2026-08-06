using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class ReviewRepository(MajstorHubDbContext context) : Repository<Review, Guid>(context), IReviewRepository
{
    public async Task<Review?> GetByBookingIdAsync(Guid bookingId)
    {
        return await DbSet.Include(r => r.Reviewer).FirstOrDefaultAsync(r => r.BookingId == bookingId);
    }

    public async Task<List<Review>> GetByCraftsmanProfileIdAsync(Guid craftsmanProfileId)
    {
        return await DbSet
            .Include(r => r.Reviewer)
            .Where(r => r.CraftsmanProfileId == craftsmanProfileId)
            .ToListAsync();
    }

    public async Task<bool> ExistsForBookingAsync(Guid bookingId)
    {
        return await DbSet.AnyAsync(r => r.BookingId == bookingId);
    }
}
