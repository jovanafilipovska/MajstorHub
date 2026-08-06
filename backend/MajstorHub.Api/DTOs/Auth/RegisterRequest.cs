using System.ComponentModel.DataAnnotations;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Auth;

public class RegisterRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Phone, MaxLength(30)]
    public string? PhoneNumber { get; set; }

    [Required]
    public UserRole Role { get; set; }
}
