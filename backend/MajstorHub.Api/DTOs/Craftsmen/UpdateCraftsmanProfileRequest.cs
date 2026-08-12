using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Craftsmen;

public class UpdateCraftsmanProfileRequest
{
    public int? ServiceCategoryId { get; set; }

    [MaxLength(150)]
    public string? BusinessName { get; set; }

    [MaxLength(1000)]
    public string? Bio { get; set; }

    [Range(0, 100000)]
    public decimal? HourlyRate { get; set; }

    [Range(0, 80)]
    public int? YearsOfExperience { get; set; }

    [Range(-90, 90)]
    public double? Latitude { get; set; }

    [Range(-180, 180)]
    public double? Longitude { get; set; }

    [MaxLength(300)]
    public string? AddressText { get; set; }

    public bool? IsAvailable { get; set; }
}
