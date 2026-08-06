using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services, IConfiguration configuration)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MajstorHubDbContext>();

        if (await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            return;
        }

        var email = configuration["AdminSeed:Email"];
        var password = configuration["AdminSeed:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Administrator",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.Users.Add(admin);
        await context.SaveChangesAsync();
    }
}
