using MajstorHub.Api.DTOs.Reviews;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MajstorHub.Api.Services;

public class ReviewService(
    IReviewRepository reviewRepository,
    IBookingRepository bookingRepository,
    IFileStorageService fileStorageService) : IReviewService
{
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png"];
    private const int MaxPhotosPerReview = 6;

    public async Task<ReviewResponse> CreateAsync(Guid reviewerUserId, CreateReviewRequest request, List<IFormFile> files)
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

        if (files.Count > MaxPhotosPerReview)
        {
            throw new ValidationException($"A review can have at most {MaxPhotosPerReview} photos.");
        }

        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(extension))
            {
                throw new ValidationException("Only JPG and PNG images are supported.");
            }
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

        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{extension}";

            await using var stream = file.OpenReadStream();
            var photoUrl = await fileStorageService.UploadAsync($"reviews/{review.Id}/{fileName}", stream, file.ContentType);

            review.PhotoUrls.Add(photoUrl);
        }

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
