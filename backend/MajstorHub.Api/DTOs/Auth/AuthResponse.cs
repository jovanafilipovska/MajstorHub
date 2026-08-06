using MajstorHub.Api.DTOs.Users;

namespace MajstorHub.Api.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public UserResponse User { get; set; } = null!;
}
