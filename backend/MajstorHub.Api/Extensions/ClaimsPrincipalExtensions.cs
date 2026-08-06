using System.Security.Claims;

namespace MajstorHub.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Token has no NameIdentifier claim.");
        return Guid.Parse(value);
    }
}
