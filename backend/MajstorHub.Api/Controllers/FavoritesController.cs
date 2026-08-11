using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize(Roles = "Client,Craftsman")]
public class FavoritesController(IFavoriteService favoriteService) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<List<CraftsmanProfileResponse>>> GetMine()
    {
        var response = await favoriteService.GetMyFavoritesAsync(User.GetUserId());
        return Ok(response);
    }

    [HttpPost("{craftsmanUserId:guid}")]
    public async Task<IActionResult> Add(Guid craftsmanUserId)
    {
        await favoriteService.AddAsync(User.GetUserId(), craftsmanUserId);
        return NoContent();
    }

    [HttpDelete("{craftsmanUserId:guid}")]
    public async Task<IActionResult> Remove(Guid craftsmanUserId)
    {
        await favoriteService.RemoveAsync(User.GetUserId(), craftsmanUserId);
        return NoContent();
    }
}