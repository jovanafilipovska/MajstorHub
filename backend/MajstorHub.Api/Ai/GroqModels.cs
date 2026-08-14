using System.Text.Json.Serialization;

namespace MajstorHub.Api.Ai;

public class GroqMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("tool_call_id")]
    public string? ToolCallId { get; set; }

    [JsonPropertyName("tool_calls")]
    public List<GroqToolCall>? ToolCalls { get; set; }
}

public class GroqToolCall
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "function";

    [JsonPropertyName("function")]
    public GroqToolCallFunction Function { get; set; } = new();
}

public class GroqToolCallFunction
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("arguments")]
    public string Arguments { get; set; } = string.Empty;
}

public class GroqToolDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // A JSON-schema object, e.g. new { type = "object", properties = new { ... }, required = new[] { "categoryId" } }
    public object Parameters { get; set; } = new { type = "object", properties = new { } };
}

public class GroqCompletionResult
{
    public string? Content { get; set; }
    public List<GroqToolCall> ToolCalls { get; set; } = new();
}