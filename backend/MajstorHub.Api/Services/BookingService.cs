using MajstorHub.Api.DTOs.Bookings;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace MajstorHub.Api.Services;

public class BookingService(
    IBookingRepository bookingRepository,
    ICraftsmanProfileRepository craftsmanProfileRepository,
    IUserRepository userRepository,
    IWebHostEnvironment webHostEnvironment) : IBookingService
{
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png"];
    private const int MaxPhotosPerBooking = 6;

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
            Latitude = request.Latitude,
            Longitude = request.Longitude,
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

    public async Task<BookingResponse> UploadPhotosAsync(Guid bookingId, Guid requestingUserId, List<IFormFile> files)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(bookingId)
            ?? throw new NotFoundException($"Booking '{bookingId}' was not found.");

        if (requestingUserId != booking.ClientId)
        {
            throw new ForbiddenException("Only the client who made this booking can attach photos.");
        }

        if (files.Count == 0)
        {
            throw new ValidationException("No photo files were provided.");
        }

        if (booking.PhotoUrls.Count + files.Count > MaxPhotosPerBooking)
        {
            throw new ValidationException($"A booking can have at most {MaxPhotosPerBooking} photos.");
        }

        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(extension))
            {
                throw new ValidationException("Only JPG and PNG images are supported.");
            }
        }

        var uploadsPath = Path.Combine(webHostEnvironment.ContentRootPath, "Uploads", "bookings", bookingId.ToString());
        Directory.CreateDirectory(uploadsPath);

        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            booking.PhotoUrls.Add($"/uploads/bookings/{bookingId}/{fileName}");
        }

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
