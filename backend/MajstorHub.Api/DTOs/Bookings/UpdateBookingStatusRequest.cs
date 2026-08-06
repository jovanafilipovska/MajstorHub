using System.ComponentModel.DataAnnotations;
using MajstorHub.Api.Models.Enums;

namespace MajstorHub.Api.DTOs.Bookings;

public class UpdateBookingStatusRequest
{
    [Required]
    public BookingStatus Status { get; set; }
}
