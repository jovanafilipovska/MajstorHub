namespace MajstorHub.Api.Ai;

public interface IGroqClient
{
    Task<GroqCompletionResult> CompleteAsync(
        List<GroqMessage> messages,
        List<GroqToolDefinition> tools,
        CancellationToken ct = default);
}