using MajstorHub.Api.DTOs.Bookings;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Services.Interfaces;

public interface IBookingService
{
    Task<BookingResponse> CreateAsync(Guid clientUserId, CreateBookingRequest request);
    Task<BookingResponse> GetByIdAsync(Guid bookingId, Guid requestingUserId);
    Task<List<BookingResponse>> GetForClientAsync(Guid clientUserId);
    Task<List<BookingResponse>> GetForCraftsmanAsync(Guid craftsmanUserId);
    Task<List<BookingResponse>> GetForUserAsync(Guid userId);
    Task<BookingResponse> UpdateStatusAsync(Guid bookingId, Guid requestingUserId, BookingStatus newStatus);
}
