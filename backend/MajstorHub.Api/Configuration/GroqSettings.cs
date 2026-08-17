namespace MajstorHub.Api.Configuration;

public class GroqSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "openai/gpt-oss-20b";
}