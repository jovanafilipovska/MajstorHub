using MajstorHub.Api.DTOs.Reviews;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(IReviewService reviewService) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Client,Craftsman")]
    [RequestSizeLimit(20_000_000)]
    public async Task<ActionResult<ReviewResponse>> Create([FromForm] CreateReviewRequest request, List<IFormFile>? files)
    {
        var response = await reviewService.CreateAsync(User.GetUserId(), request, files ?? []);
        return Ok(response);
    }
}
