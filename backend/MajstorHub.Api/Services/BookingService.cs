using MajstorHub.Api.DTOs.Bookings;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services;

public class BookingService(
    IBookingRepository bookingRepository,
    ICraftsmanProfileRepository craftsmanProfileRepository,
    IUserRepository userRepository) : IBookingService
{
    public async Task<BookingResponse> CreateAsync(Guid clientUserId, CreateBookingRequest request)
    {
        _ = await userRepository.GetByIdAsync(clientUserId)
            ?? throw new NotFoundException($"User '{clientUserId}' was not found.");

        var craftsmanProfile = await craftsmanProfileRepository.GetByUserIdAsync(request.CraftsmanProfileId)
            ?? throw new NotFoundException($"Craftsman profile '{request.CraftsmanProfileId}' was not found.");

        if (clientUserId == craftsmanProfile.UserId)
        {
            throw new ValidationException("You cannot book your own craftsman profile.");
        }

        if (!craftsmanProfile.IsAvailable)
        {
            throw new ValidationException("This craftsman is not currently available.");
        }

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            ClientId = clientUserId,
            CraftsmanProfileId = request.CraftsmanProfileId,
            ServiceCategoryId = request.ServiceCategoryId,
            Description = request.Description,
            Address = request.Address,
            ScheduledAt = request.ScheduledAt,
            Status = BookingStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await bookingRepository.AddAsync(booking);
        await bookingRepository.SaveChangesAsync();

        var created = await bookingRepository.GetByIdWithDetailsAsync(booking.Id)
            ?? throw new NotFoundException($"Booking '{booking.Id}' was not found after creation.");
        return created.ToResponse();
    }

    public async Task<BookingResponse> GetByIdAsync(Guid bookingId, Guid requestingUserId)
    {
        var booking = await GetOwnedBookingAsync(bookingId, requestingUserId);
        return booking.ToResponse();
    }

    public async Task<List<BookingResponse>> GetForClientAsync(Guid clientUserId)
    {
        var bookings = await bookingRepository.GetByClientIdAsync(clientUserId);
        return bookings.Select(b => b.ToResponse()).ToList();
    }

    public async Task<List<BookingResponse>> GetForCraftsmanAsync(Guid craftsmanUserId)
    {
        var bookings = await bookingRepository.GetByCraftsmanProfileIdAsync(craftsmanUserId);
        return bookings.Select(b => b.ToResponse()).ToList();
    }

    public async Task<List<BookingResponse>> GetForUserAsync(Guid userId)
    {
        var asClient = await bookingRepository.GetByClientIdAsync(userId);
        var asCraftsman = await bookingRepository.GetByCraftsmanProfileIdAsync(userId);
        return asClient.Concat(asCraftsman)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => b.ToResponse())
            .ToList();
    }

    public async Task<BookingResponse> UpdateStatusAsync(Guid bookingId, Guid requestingUserId, BookingStatus newStatus)
    {
        var booking = await GetOwnedBookingAsync(bookingId, requestingUserId);
        var isCraftsman = requestingUserId == booking.CraftsmanProfileId;

        var isAllowed = (booking.Status, newStatus) switch
        {
            (BookingStatus.Pending, BookingStatus.Accepted) => isCraftsman,
            (BookingStatus.Pending, BookingStatus.Rejected) => isCraftsman,
            (BookingStatus.Accepted, BookingStatus.Completed) => isCraftsman,
            (BookingStatus.Accepted, BookingStatus.Cancelled) => true,
            _ => false
        };

        if (!isAllowed)
        {
            throw new InvalidTransitionException(
                $"Cannot transition booking from '{booking.Status}' to '{newStatus}' as this participant.");
        }

        booking.Status = newStatus;
        booking.UpdatedAt = DateTimeOffset.UtcNow;

        bookingRepository.Update(booking);
        await bookingRepository.SaveChangesAsync();

        return booking.ToResponse();
    }

    private async Task<Booking> GetOwnedBookingAsync(Guid bookingId, Guid requestingUserId)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(bookingId)
            ?? throw new NotFoundException($"Booking '{bookingId}' was not found.");

        if (requestingUserId != booking.ClientId && requestingUserId != booking.CraftsmanProfileId)
        {
            throw new ForbiddenException("You are not a participant in this booking.");
        }

        return booking;
    }
}
