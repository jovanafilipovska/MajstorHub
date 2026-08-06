using MajstorHub.Api.DTOs.Reviews;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services;

public class ReviewService(IReviewRepository reviewRepository, IBookingRepository bookingRepository) : IReviewService
{
    public async Task<ReviewResponse> CreateAsync(Guid reviewerUserId, CreateReviewRequest request)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId)
            ?? throw new NotFoundException($"Booking '{request.BookingId}' was not found.");

        if (booking.ClientId != reviewerUserId)
        {
            throw new ForbiddenException("Only the client on this booking can leave a review.");
        }

        if (booking.Status != BookingStatus.Completed)
        {
            throw new ValidationException("Only completed bookings can be reviewed.");
        }

        if (await reviewRepository.ExistsForBookingAsync(request.BookingId))
        {
            throw new ConflictException("This booking has already been reviewed.");
        }

        var review = new Review
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            ReviewerId = reviewerUserId,
            CraftsmanProfileId = booking.CraftsmanProfileId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await reviewRepository.AddAsync(review);
        await reviewRepository.SaveChangesAsync();

        var created = await reviewRepository.GetByBookingIdAsync(booking.Id)
            ?? throw new NotFoundException($"Review for booking '{booking.Id}' was not found after creation.");
        return created.ToResponse();
    }

    public async Task<List<ReviewResponse>> GetForCraftsmanAsync(Guid craftsmanProfileId)
    {
        var reviews = await reviewRepository.GetByCraftsmanProfileIdAsync(craftsmanProfileId);
        return reviews.Select(r => r.ToResponse()).ToList();
    }
}
