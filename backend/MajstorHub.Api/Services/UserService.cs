using MajstorHub.Api.DTOs.Users;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace MajstorHub.Api.Services;

public class UserService(IUserRepository userRepository, IWebHostEnvironment webHostEnvironment) : IUserService
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

        if (request.FullName is not null) user.FullName = request.FullName;
        if (request.PhoneNumber is not null) user.PhoneNumber = request.PhoneNumber;
        if (request.AddressText is not null) user.AddressText = request.AddressText;

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
            throw new UnauthorizedException("Current password is incorrect.");
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

        var uploadsPath = Path.Combine(webHostEnvironment.ContentRootPath, "Uploads", "avatars");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{userId}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.ProfileImageUrl = $"/uploads/avatars/{fileName}";
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
            var filePath = Path.Combine(webHostEnvironment.ContentRootPath, "Uploads", "avatars", fileName);
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch (IOException)
            {
                // File briefly locked (e.g. still being streamed to a client, or scanned by
                // antivirus) - not worth failing the request over. It's an orphaned upload
                // at worst, cleaned up next time a file with the same name is written.
            }
            catch (UnauthorizedAccessException)
            {
                // Same reasoning as above: a locked/permission-denied file shouldn't block
                // the user from clearing their profile photo.
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
