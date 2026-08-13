using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MajstorHub.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
}