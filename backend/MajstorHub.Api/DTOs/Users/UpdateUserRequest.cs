using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Users;

public class UpdateUserRequest
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    [Phone, MaxLength(30)]
    public string? PhoneNumber { get; set; }

    [MaxLength(300)]
    public string? AddressText { get; set; }
}
