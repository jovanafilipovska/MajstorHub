using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.DTOs.Reviews;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/craftsmen")]
public class CraftsmenController(ICraftsmanProfileService craftsmanProfileService, IReviewService reviewService)
    : ControllerBase
{
    [HttpPost("me/profile")]
    [Authorize(Roles = "Client,Craftsman")]
    public async Task<ActionResult<CraftsmanProfileResponse>> CreateMyProfile(CreateCraftsmanProfileRequest request)
    {
        var response = await craftsmanProfileService.CreateAsync(User.GetUserId(), request);
        return Ok(response);
    }

    [HttpPut("me/profile")]
    [Authorize(Roles = "Client,Craftsman")]
    public async Task<ActionResult<CraftsmanProfileResponse>> UpdateMyProfile(UpdateCraftsmanProfileRequest request)
    {
        var response = await craftsmanProfileService.UpdateAsync(User.GetUserId(), request);
        return Ok(response);
    }

    [HttpGet("{userId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<CraftsmanProfileResponse>> GetById(Guid userId)
    {
        var response = await craftsmanProfileService.GetByIdAsync(userId);
        return Ok(response);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<CraftsmanProfileResponse>>> Search(
        [FromQuery] int? categoryId,
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double? radiusKm)
    {
        if (lat is not null && lng is not null)
        {
            var response = await craftsmanProfileService.SearchNearbyAsync(lat.Value, lng.Value, radiusKm ?? 25);
            return Ok(response);
        }

        if (categoryId is not null)
        {
            var response = await craftsmanProfileService.GetByCategoryAsync(categoryId.Value);
            return Ok(response);
        }

        return Ok(await craftsmanProfileService.GetAllAsync());
    }

    [HttpGet("{userId:guid}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ReviewResponse>>> GetReviews(Guid userId)
    {
        var response = await reviewService.GetForCraftsmanAsync(userId);
        return Ok(response);
    }
}
