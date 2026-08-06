using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Reviews;

public class CreateReviewRequest
{
    [Required]
    public Guid BookingId { get; set; }

    [Required, Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}
