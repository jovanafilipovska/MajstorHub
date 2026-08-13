using MajstorHub.Api.Data;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Repositories;

public class MessageRepository(MajstorHubDbContext context) : Repository<Message, Guid>(context), IMessageRepository
{
    public async Task<List<Message>> GetByBookingIdAsync(Guid bookingId)
    {
        return await DbSet
            .Include(m => m.Sender)
            .Where(m => m.BookingId == bookingId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<Message?> GetLastForBookingAsync(Guid bookingId)
    {
        return await DbSet
            .Where(m => m.BookingId == bookingId)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid bookingId, Guid viewerId)
    {
        return await DbSet.CountAsync(m => m.BookingId == bookingId && m.SenderId != viewerId && m.ReadAt == null);
    }

    public async Task<int> MarkAllReadAsync(Guid bookingId, Guid viewerId)
    {
        return await DbSet
            .Where(m => m.BookingId == bookingId && m.SenderId != viewerId && m.ReadAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.ReadAt, DateTimeOffset.UtcNow));
    }
}