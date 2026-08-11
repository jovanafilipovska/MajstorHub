using MajstorHub.Api.DTOs.Users;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangeMyPassword(ChangePasswordRequest request)
    {
        await userService.ChangePasswordAsync(User.GetUserId(), request);
        return NoContent();
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        await userService.DeleteAsync(User.GetUserId());
        return NoContent();
    }

    [HttpPost("me/photo")]
    [RequestSizeLimit(5_000_000)]
    public async Task<ActionResult<UserResponse>> UploadMyPhoto(IFormFile file)
    {
        var response = await userService.UploadProfileImageAsync(User.GetUserId(), file);
        return Ok(response);
    }

    [HttpDelete("me/photo")]
    public async Task<ActionResult<UserResponse>> DeleteMyPhoto()
    {
        var response = await userService.RemoveProfileImageAsync(User.GetUserId());
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
