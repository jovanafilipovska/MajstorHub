using MajstorHub.Api.DTOs.Bookings;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController(IBookingService bookingService) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Client,Craftsman")]
    public async Task<ActionResult<BookingResponse>> Create(CreateBookingRequest request)
    {
        var response = await bookingService.CreateAsync(User.GetUserId(), request);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BookingResponse>> GetById(Guid id)
    {
        var response = await bookingService.GetByIdAsync(id, User.GetUserId());
        return Ok(response);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<BookingResponse>>> GetMine()
    {
        var response = await bookingService.GetForUserAsync(User.GetUserId());
        return Ok(response);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<BookingResponse>> UpdateStatus(Guid id, UpdateBookingStatusRequest request)
    {
        var response = await bookingService.UpdateStatusAsync(id, User.GetUserId(), request.Status);
        return Ok(response);
    }
}
