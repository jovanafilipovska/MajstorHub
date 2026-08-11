using MajstorHub.Api.DTOs.Users;
using Microsoft.AspNetCore.Http;

namespace MajstorHub.Api.Services.Interfaces;

public interface IUserService
{
    Task<UserResponse> GetByIdAsync(Guid id);
    Task<UserResponse> UpdateAsync(Guid userId, UpdateUserRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<UserResponse> UploadProfileImageAsync(Guid userId, IFormFile file);
    Task<UserResponse> RemoveProfileImageAsync(Guid userId);
    Task<List<UserResponse>> GetAllAsync();
    Task DeleteAsync(Guid id);
}
