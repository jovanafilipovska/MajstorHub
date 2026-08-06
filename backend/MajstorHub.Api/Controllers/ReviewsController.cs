using MajstorHub.Api.DTOs.Reviews;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(IReviewService reviewService) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ReviewResponse>> Create(CreateReviewRequest request)
    {
        var response = await reviewService.CreateAsync(User.GetUserId(), request);
        return Ok(response);
    }
}
