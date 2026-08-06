using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IReviewRepository : IRepository<Review, Guid>
{
    Task<Review?> GetByBookingIdAsync(Guid bookingId);
    Task<List<Review>> GetByCraftsmanProfileIdAsync(Guid craftsmanProfileId);
    Task<bool> ExistsForBookingAsync(Guid bookingId);
}
