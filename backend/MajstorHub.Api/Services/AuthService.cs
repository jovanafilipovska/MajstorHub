using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MajstorHub.Api.Configuration;
using MajstorHub.Api.DTOs.Auth;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MajstorHub.Api.Services;

public class AuthService(IUserRepository userRepository, IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwtSettings = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (request.Role == UserRole.Admin)
        {
            throw new ValidationException("Cannot self-register as Admin.");
        }

        if (await userRepository.ExistsByEmailAsync(request.Email))
        {
            throw new ConflictException($"A user with email '{request.Email}' already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            PhoneNumber = request.PhoneNumber,
            Role = request.Role,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await userRepository.AddAsync(user);
        await userRepository.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(request.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        return BuildAuthResponse(user);
    }

    private AuthResponse BuildAuthResponse(User user)
    {
        var (token, expiresAt) = GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = user.ToResponse()
        };
    }

    private (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
