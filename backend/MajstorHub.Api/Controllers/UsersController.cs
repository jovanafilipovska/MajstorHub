using MajstorHub.Api.DTOs.Users;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(IUserService userService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetMe()
    {
        var response = await userService.GetByIdAsync(User.GetUserId());
        return Ok(response);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserResponse>> UpdateMe(UpdateUserRequest request)
    {
        var response = await userService.UpdateAsync(User.GetUserId(), request);
        return Ok(response);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        var response = await userService.GetAllAsync();
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await userService.DeleteAsync(id);
        return NoContent();
    }
}
