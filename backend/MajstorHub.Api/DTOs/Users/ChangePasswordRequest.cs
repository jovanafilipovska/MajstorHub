using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Users;

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}