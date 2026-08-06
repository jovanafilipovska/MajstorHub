using MajstorHub.Api.DTOs.Users;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services;

public class UserService(IUserRepository userRepository) : IUserService
{
    public async Task<UserResponse> GetByIdAsync(Guid id)
    {
        var user = await userRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"User '{id}' was not found.");
        return user.ToResponse();
    }

    public async Task<UserResponse> UpdateAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException($"User '{userId}' was not found.");

        if (request.FullName is not null) user.FullName = request.FullName;
        if (request.PhoneNumber is not null) user.PhoneNumber = request.PhoneNumber;

        userRepository.Update(user);
        await userRepository.SaveChangesAsync();

        return user.ToResponse();
    }

    public async Task<List<UserResponse>> GetAllAsync()
    {
        var users = await userRepository.GetAllAsync();
        return users.Select(u => u.ToResponse()).ToList();
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await userRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"User '{id}' was not found.");

        userRepository.Remove(user);
        await userRepository.SaveChangesAsync();
    }
}
