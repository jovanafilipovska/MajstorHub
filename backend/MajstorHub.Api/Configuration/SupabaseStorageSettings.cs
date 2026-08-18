namespace MajstorHub.Api.Configuration;

public class SupabaseStorageSettings
{
    public string Url { get; set; } = string.Empty;
    public string ServiceRoleKey { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;
}