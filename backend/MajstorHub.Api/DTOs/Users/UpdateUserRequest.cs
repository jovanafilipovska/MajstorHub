using System.ComponentModel.DataAnnotations;

namespace MajstorHub.Api.DTOs.Users;

public class UpdateUserRequest
{
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [EmailAddress, MaxLength(256)]
    public string? Email { get; set; }

    [Phone, MaxLength(30)]
    public string? PhoneNumber { get; set; }

    [MaxLength(150)]
    public string? Street { get; set; }

    [MaxLength(20)]
    public string? HouseNumber { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }
}