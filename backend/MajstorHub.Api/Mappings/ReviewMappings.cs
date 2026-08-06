using MajstorHub.Api.DTOs.Reviews;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class ReviewMappings
{
    public static ReviewResponse ToResponse(this Review review)
    {
        return new ReviewResponse
        {
            Id = review.Id,
            BookingId = review.BookingId,
            ReviewerId = review.ReviewerId,
            ReviewerName = review.Reviewer.FullName,
            CraftsmanProfileId = review.CraftsmanProfileId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }
}
