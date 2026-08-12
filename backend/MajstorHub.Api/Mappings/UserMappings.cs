using MajstorHub.Api.DTOs.Users;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class UserMappings
{
    public static UserResponse ToResponse(this User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Street = user.Street,
            HouseNumber = user.HouseNumber,
            City = user.City,
            Country = user.Country,
            ProfileImageUrl = user.ProfileImageUrl,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
