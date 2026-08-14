using MajstorHub.Api.DTOs.Chatbot;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/chatbot")]
[Authorize(Roles = "Client,Craftsman")]
public class ChatbotController(IChatbotService chatbotService) : ControllerBase
{
    [HttpPost("message")]
    public async Task<ActionResult<ChatbotMessageResponse>> SendMessage(SendChatbotMessageRequest request, CancellationToken ct)
    {
        var response = await chatbotService.SendMessageAsync(
            User.GetUserId(), request.Mode, request.Message, request.Latitude, request.Longitude, ct);
        return Ok(response);
    }

    [HttpGet("conversation")]
    public async Task<ActionResult<ChatbotConversationResponse>> GetConversation([FromQuery] ChatbotMode mode)
    {
        var response = await chatbotService.GetConversationAsync(User.GetUserId(), mode);
        return Ok(response);
    }

    [HttpDelete("conversation")]
    public async Task<IActionResult> ResetConversation([FromQuery] ChatbotMode mode)
    {
        await chatbotService.ResetConversationAsync(User.GetUserId(), mode);
        return NoContent();
    }
}