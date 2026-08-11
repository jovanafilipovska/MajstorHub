namespace MajstorHub.Api.DTOs.Craftsmen;

public class CraftsmanProfileResponse
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int ServiceCategoryId { get; set; }
    public string ServiceCategoryName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public decimal HourlyRate { get; set; }
    public int? YearsOfExperience { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? AddressText { get; set; }
    public bool IsAvailable { get; set; }
    public double? AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
