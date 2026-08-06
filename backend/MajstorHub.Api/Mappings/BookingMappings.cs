using MajstorHub.Api.DTOs.Bookings;
using MajstorHub.Api.Models;

namespace MajstorHub.Api.Mappings;

public static class BookingMappings
{
    public static BookingResponse ToResponse(this Booking booking)
    {
        return new BookingResponse
        {
            Id = booking.Id,
            ClientId = booking.ClientId,
            ClientName = booking.Client.FullName,
            CraftsmanProfileId = booking.CraftsmanProfileId,
            CraftsmanName = booking.CraftsmanProfile.User.FullName,
            ServiceCategoryName = booking.ServiceCategory.Name,
            Description = booking.Description,
            Address = booking.Address,
            ScheduledAt = booking.ScheduledAt,
            Status = booking.Status,
            PriceQuote = booking.PriceQuote,
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt
        };
    }
}
