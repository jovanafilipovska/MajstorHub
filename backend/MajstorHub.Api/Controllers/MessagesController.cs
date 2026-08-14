using MajstorHub.Api.DTOs.Messages;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize(Roles = "Client,Craftsman")]
public class MessagesController(IMessageService messageService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<MessageResponse>> Send(SendMessageRequest request)
    {
        var response = await messageService.SendAsync(User.GetUserId(), request);
        return Ok(response);
    }

    [HttpPost("booking/{bookingId:guid}/photo")]
    [RequestSizeLimit(20_000_000)]
    public async Task<ActionResult<MessageResponse>> SendPhoto(Guid bookingId, IFormFile file)
    {
        var response = await messageService.SendPhotoAsync(User.GetUserId(), bookingId, file);
        return Ok(response);
    }

    [HttpGet("booking/{bookingId:guid}")]
    public async Task<ActionResult<List<MessageResponse>>> GetHistory(Guid bookingId)
    {
        var response = await messageService.GetHistoryAsync(bookingId, User.GetUserId());
        return Ok(response);
    }

    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationSummaryResponse>>> GetConversations()
    {
        var response = await messageService.GetConversationsAsync(User.GetUserId());
        return Ok(response);
    }

    [HttpPost("booking/{bookingId:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid bookingId)
    {
        await messageService.MarkReadAsync(bookingId, User.GetUserId());
        return NoContent();
    }

    [HttpDelete("booking/{bookingId:guid}")]
    public async Task<IActionResult> DeleteConversation(Guid bookingId)
    {
        await messageService.DeleteConversationAsync(bookingId, User.GetUserId());
        return NoContent();
    }
}