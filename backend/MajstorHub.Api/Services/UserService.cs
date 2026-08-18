using MajstorHub.Api.DTOs.Users;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace MajstorHub.Api.Services;

public class UserService(IUserRepository userRepository, IFileStorageService fileStorageService) : IUserService
{
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png"];
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

        if (request.Email is not null && !request.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await userRepository.ExistsByEmailAsync(request.Email))
            {
                throw new ConflictException($"A user with email '{request.Email}' already exists.");
            }
            user.Email = request.Email;
        }

        if (request.FirstName is not null) user.FirstName = request.FirstName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (request.PhoneNumber is not null) user.PhoneNumber = request.PhoneNumber;
        if (request.Street is not null) user.Street = request.Street;
        if (request.HouseNumber is not null) user.HouseNumber = request.HouseNumber;
        if (request.City is not null) user.City = request.City;
        if (request.Country is not null) user.Country = request.Country;

        userRepository.Update(user);
        await userRepository.SaveChangesAsync();

        return user.ToResponse();
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException($"User '{userId}' was not found.");

        if (!BC.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new ValidationException("Current password is incorrect.");
        }

        if (BC.Verify(request.NewPassword, user.PasswordHash))
        {
            throw new ValidationException("New password must be different from the current password.");
        }

        user.PasswordHash = BC.HashPassword(request.NewPassword);

        userRepository.Update(user);
        await userRepository.SaveChangesAsync();
    }

    public async Task<UserResponse> UploadProfileImageAsync(Guid userId, IFormFile file)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException($"User '{userId}' was not found.");

        if (file.Length == 0)
        {
            throw new ValidationException("No image file was provided.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedImageExtensions.Contains(extension))
        {
            throw new ValidationException("Only JPG and PNG images are supported.");
        }

        var fileName = $"{userId}{extension}";

        await using var stream = file.OpenReadStream();
        user.ProfileImageUrl = await fileStorageService.UploadAsync($"avatars/{fileName}", stream, file.ContentType);
        userRepository.Update(user);
        await userRepository.SaveChangesAsync();

        return user.ToResponse();
    }

    public async Task<UserResponse> RemoveProfileImageAsync(Guid userId)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException($"User '{userId}' was not found.");

        if (user.ProfileImageUrl is not null)
        {
            var fileName = Path.GetFileName(user.ProfileImageUrl);
            try
            {
                await fileStorageService.DeleteAsync($"avatars/{fileName}");
            }
            catch (InvalidOperationException)
            {
                // Not worth failing the request over - it's an orphaned upload at worst,
                // cleaned up next time a file with the same name is written.
            }

            user.ProfileImageUrl = null;
            userRepository.Update(user);
            await userRepository.SaveChangesAsync();
        }

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

        try
        {
            await userRepository.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(
                "This user cannot be deleted because they have existing bookings or reviews.");
        }
    }
}
