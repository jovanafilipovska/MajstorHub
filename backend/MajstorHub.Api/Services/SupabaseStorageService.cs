using System.Net.Http.Headers;
using MajstorHub.Api.Configuration;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace MajstorHub.Api.Services;

public class SupabaseStorageService(HttpClient httpClient, IOptions<SupabaseStorageSettings> settings) : IFileStorageService
{
    private readonly SupabaseStorageSettings _settings = settings.Value;

    public async Task<string> UploadAsync(string path, Stream content, string contentType, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, $"{_settings.Url}/storage/v1/object/{_settings.Bucket}/{path}")
        {
            Content = new StreamContent(content)
        };
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ServiceRoleKey);
        // Supabase Storage rejects a second PUT to an existing path unless told to overwrite.
        request.Headers.Add("x-upsert", "true");

        using var response = await httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Supabase Storage upload failed ({(int)response.StatusCode}): {body}");
        }

        return $"{_settings.Url}/storage/v1/object/public/{_settings.Bucket}/{path}";
    }

    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{_settings.Url}/storage/v1/object/{_settings.Bucket}/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ServiceRoleKey);

        using var response = await httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Supabase Storage delete failed ({(int)response.StatusCode}): {body}");
        }
    }
}