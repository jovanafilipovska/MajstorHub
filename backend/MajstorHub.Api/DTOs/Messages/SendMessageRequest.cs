using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Messages;

public class SendMessageRequest
{
    [Required]
    public Guid BookingId { get; set; }

    [Required, MaxLength(2000)]
    public string Body { get; set; } = string.Empty;
}