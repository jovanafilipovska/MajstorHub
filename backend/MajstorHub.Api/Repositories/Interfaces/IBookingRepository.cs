using MajstorHub.Api.Models;

namespace MajstorHub.Api.Repositories.Interfaces;

public interface IBookingRepository : IRepository<Booking, Guid>
{
    Task<List<Booking>> GetByClientIdAsync(Guid clientId);
    Task<List<Booking>> GetByCraftsmanProfileIdAsync(Guid craftsmanProfileId);
    Task<Booking?> GetByIdWithDetailsAsync(Guid id);
    Task<List<Booking>> GetCompletedByCategoryAsync(int serviceCategoryId);
}
