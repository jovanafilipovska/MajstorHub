using MajstorHub.Api.DTOs.ServiceCategories;
using MajstorHub.Api.Extensions;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Controllers;

[ApiController]
[Route("api/service-categories")]
public class ServiceCategoriesController(IServiceCategoryService serviceCategoryService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<ServiceCategoryResponse>>> GetAll()
    {
        var response = await serviceCategoryService.GetAllAsync();
        return Ok(response);
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ServiceCategoryResponse>>> GetPending()
    {
        var response = await serviceCategoryService.GetPendingAsync();
        return Ok(response);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceCategoryResponse>> GetById(int id)
    {
        var response = await serviceCategoryService.GetByIdAsync(id);
        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ServiceCategoryResponse>> Create(CreateServiceCategoryRequest request)
    {
        var response = await serviceCategoryService.CreateAsync(request);
        return Ok(response);
    }

    [HttpPost("suggest")]
    [Authorize(Roles = "Client,Craftsman")]
    public async Task<ActionResult<ServiceCategoryResponse>> Suggest(CreateServiceCategoryRequest request)
    {
        var response = await serviceCategoryService.SuggestAsync(User.GetUserId(), request);
        return Ok(response);
    }

    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ServiceCategoryResponse>> Approve(int id)
    {
        var response = await serviceCategoryService.ApproveAsync(id);
        return Ok(response);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ServiceCategoryResponse>> Update(int id, UpdateServiceCategoryRequest request)
    {
        var response = await serviceCategoryService.UpdateAsync(id, request);
        return Ok(response);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await serviceCategoryService.DeleteAsync(id);
        return NoContent();
    }
}
