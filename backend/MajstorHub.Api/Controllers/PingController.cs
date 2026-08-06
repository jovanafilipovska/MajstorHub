using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PingController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok" });
    }
}
