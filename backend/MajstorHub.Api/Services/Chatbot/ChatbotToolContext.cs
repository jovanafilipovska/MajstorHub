using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Services.Chatbot;

public record ChatbotToolContext(Guid UserId, ChatbotMode Mode, double? Latitude, double? Longitude);