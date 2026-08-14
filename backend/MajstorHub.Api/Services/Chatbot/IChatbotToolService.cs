using MajstorHub.Api.Ai;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.Services.Chatbot;

public interface IChatbotToolService
{
    List<GroqToolDefinition> GetToolDefinitions(ChatbotMode mode);
    Task<object> ExecuteAsync(string toolName, string argumentsJson, ChatbotToolContext context, CancellationToken ct = default);
}