using MajstorHub.Api.DTOs.Users;

namespace MajstorHub.Api.Services.Interfaces;

public interface IUserService
{
    Task<UserResponse> GetByIdAsync(Guid id);
    Task<UserResponse> UpdateAsync(Guid userId, UpdateUserRequest request);
    Task<List<UserResponse>> GetAllAsync();
    Task DeleteAsync(Guid id);
}
