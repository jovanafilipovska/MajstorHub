using MajstorHub.Api.DTOs.ServiceCategories;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Services;

public class ServiceCategoryService(IServiceCategoryRepository serviceCategoryRepository) : IServiceCategoryService
{
    public async Task<List<ServiceCategoryResponse>> GetAllAsync()
    {
        var categories = await serviceCategoryRepository.GetAllAsync();
        return categories.Select(c => c.ToResponse()).ToList();
    }

    public async Task<ServiceCategoryResponse> GetByIdAsync(int id)
    {
        var category = await serviceCategoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Service category '{id}' was not found.");
        return category.ToResponse();
    }

    public async Task<ServiceCategoryResponse> CreateAsync(CreateServiceCategoryRequest request)
    {
        if (await serviceCategoryRepository.GetByNameAsync(request.Name) is not null)
        {
            throw new ConflictException($"A service category named '{request.Name}' already exists.");
        }

        var category = new ServiceCategory
        {
            Name = request.Name,
            Description = request.Description
        };

        await serviceCategoryRepository.AddAsync(category);
        await serviceCategoryRepository.SaveChangesAsync();

        return category.ToResponse();
    }

    public async Task<ServiceCategoryResponse> UpdateAsync(int id, UpdateServiceCategoryRequest request)
    {
        var category = await serviceCategoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Service category '{id}' was not found.");

        if (request.Name is not null) category.Name = request.Name;
        if (request.Description is not null) category.Description = request.Description;

        serviceCategoryRepository.Update(category);
        await serviceCategoryRepository.SaveChangesAsync();

        return category.ToResponse();
    }

    public async Task DeleteAsync(int id)
    {
        var category = await serviceCategoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Service category '{id}' was not found.");

        serviceCategoryRepository.Remove(category);

        try
        {
            await serviceCategoryRepository.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(
                "This category cannot be deleted because craftsmen or bookings still reference it.");
        }
    }
}
