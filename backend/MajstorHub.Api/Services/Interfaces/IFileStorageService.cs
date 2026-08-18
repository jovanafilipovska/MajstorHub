namespace MajstorHub.Api.Services.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(string path, Stream content, string contentType, CancellationToken ct = default);

    Task DeleteAsync(string path, CancellationToken ct = default);
}