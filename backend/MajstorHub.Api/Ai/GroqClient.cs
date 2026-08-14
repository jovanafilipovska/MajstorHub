using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using MajstorHub.Api.Configuration;
using Microsoft.Extensions.Options;

namespace MajstorHub.Api.Ai;

public class GroqClient(HttpClient httpClient, IOptions<GroqSettings> settings) : IGroqClient
{
    private const string Endpoint = "https://api.groq.com/openai/v1/chat/completions";
    // Groq validates message shape per role and rejects a present-but-null
    // tool_calls/tool_call_id (e.g. on system/user messages), so nulls must
    // be omitted rather than serialized.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly GroqSettings _settings = settings.Value;

    public async Task<GroqCompletionResult> CompleteAsync(
        List<GroqMessage> messages,
        List<GroqToolDefinition> tools,
        CancellationToken ct = default)
    {
        var payload = new
        {
            model = _settings.Model,
            messages,
            tools = tools.Count > 0
                ? tools.Select(t => new
                {
                    type = "function",
                    function = new { name = t.Name, description = t.Description, parameters = t.Parameters }
                })
                : null,
            tool_choice = tools.Count > 0 ? "auto" : null,
            temperature = 0.3
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = JsonContent.Create(payload, options: JsonOptions)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

        using var response = await httpClient.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Groq API request failed ({(int)response.StatusCode}): {body}");
        }

        var parsed = JsonSerializer.Deserialize<ChatCompletionResponse>(body, JsonOptions)
            ?? throw new InvalidOperationException("Groq API returned an empty response.");
        var message = parsed.Choices.FirstOrDefault()?.Message
            ?? throw new InvalidOperationException("Groq API response had no choices.");

        return new GroqCompletionResult
        {
            Content = message.Content,
            ToolCalls = message.ToolCalls ?? []
        };
    }

    private class ChatCompletionResponse
    {
        [JsonPropertyName("choices")]
        public List<Choice> Choices { get; set; } = [];
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public ResponseMessage Message { get; set; } = new();
    }

    private class ResponseMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("tool_calls")]
        public List<GroqToolCall>? ToolCalls { get; set; }
    }
}