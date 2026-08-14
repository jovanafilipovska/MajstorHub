using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IMessageRepository : IRepository<Message, Guid>
{
    Task<List<Message>> GetByBookingIdAsync(Guid bookingId);
    Task<Message?> GetLastForBookingAsync(Guid bookingId);
    Task<int> GetUnreadCountAsync(Guid bookingId, Guid viewerId);
    Task<int> MarkAllReadAsync(Guid bookingId, Guid viewerId);
    Task DeleteAllForBookingAsync(Guid bookingId);
}