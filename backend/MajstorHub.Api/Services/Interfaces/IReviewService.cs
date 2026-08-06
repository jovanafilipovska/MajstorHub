using MajstorHub.Api.DTOs.Reviews;

namespace MajstorHub.Api.Services.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateAsync(Guid reviewerUserId, CreateReviewRequest request);
    Task<List<ReviewResponse>> GetForCraftsmanAsync(Guid craftsmanProfileId);
}
