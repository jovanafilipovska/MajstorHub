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
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AddressText = user.AddressText,
            ProfileImageUrl = user.ProfileImageUrl,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
