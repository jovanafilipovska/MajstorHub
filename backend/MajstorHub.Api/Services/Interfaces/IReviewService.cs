using MajstorHub.Api.DTOs.Reviews;
using Microsoft.AspNetCore.Http;

namespace MajstorHub.Api.Services.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateAsync(Guid reviewerUserId, CreateReviewRequest request, List<IFormFile> files);
    Task<List<ReviewResponse>> GetForCraftsmanAsync(Guid craftsmanProfileId);
}
