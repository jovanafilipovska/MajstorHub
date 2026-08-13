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
            ClientProfileImageUrl = booking.Client.ProfileImageUrl,
            CraftsmanProfileId = booking.CraftsmanProfileId,
            CraftsmanName = booking.CraftsmanProfile.User.FullName,
            CraftsmanProfileImageUrl = booking.CraftsmanProfile.User.ProfileImageUrl,
            ServiceCategoryId = booking.ServiceCategoryId,
            ServiceCategoryName = booking.ServiceCategory.Name,
            Description = booking.Description,
            Address = booking.Address,
            Latitude = booking.Latitude,
            Longitude = booking.Longitude,
            PhotoUrls = booking.PhotoUrls,
            ScheduledAt = booking.ScheduledAt,
            Status = booking.Status,
            PriceQuote = booking.PriceQuote,
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt,
            HasReview = booking.Review != null
        };
    }
}
