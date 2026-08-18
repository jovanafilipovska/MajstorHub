using MajstorHub.Api.Ai;
using MajstorHub.Api.DTOs.ServiceCategories;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Services;

public class ServiceCategoryService(
    IServiceCategoryRepository serviceCategoryRepository,
    ITranslationService translationService) : IServiceCategoryService
{
    public async Task<List<ServiceCategoryResponse>> GetAllAsync()
    {
        var categories = await serviceCategoryRepository.GetApprovedAsync();
        return categories.Select(c => c.ToResponse()).ToList();
    }

    public async Task<List<ServiceCategoryResponse>> GetPendingAsync()
    {
        var categories = await serviceCategoryRepository.GetPendingAsync();
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
        var translation = await translationService.TranslateCategoryAsync(request.Name, request.Description);

        if (await serviceCategoryRepository.FindByAnyNameAsync(translation.NameEn, translation.NameMk, translation.NameSq) is not null)
        {
            throw new ConflictException($"A service category named '{request.Name}' already exists.");
        }

        var category = new ServiceCategory
        {
            NameEn = translation.NameEn,
            NameMk = translation.NameMk,
            NameSq = translation.NameSq,
            DescriptionEn = translation.DescriptionEn,
            DescriptionMk = translation.DescriptionMk,
            DescriptionSq = translation.DescriptionSq,
            IsApproved = true
        };

        await serviceCategoryRepository.AddAsync(category);
        await serviceCategoryRepository.SaveChangesAsync();

        return category.ToResponse();
    }

    public async Task<ServiceCategoryResponse> SuggestAsync(Guid userId, CreateServiceCategoryRequest request)
    {
        var translation = await translationService.TranslateCategoryAsync(request.Name, request.Description);

        if (await serviceCategoryRepository.FindByAnyNameAsync(translation.NameEn, translation.NameMk, translation.NameSq) is not null)
        {
            throw new ConflictException($"A service category named '{request.Name}' already exists.");
        }

        var category = new ServiceCategory
        {
            NameEn = translation.NameEn,
            NameMk = translation.NameMk,
            NameSq = translation.NameSq,
            DescriptionEn = translation.DescriptionEn,
            DescriptionMk = translation.DescriptionMk,
            DescriptionSq = translation.DescriptionSq,
            IsApproved = false,
            SuggestedByUserId = userId
        };

        await serviceCategoryRepository.AddAsync(category);
        await serviceCategoryRepository.SaveChangesAsync();

        return category.ToResponse();
    }

    public async Task<ServiceCategoryResponse> ApproveAsync(int id)
    {
        var category = await serviceCategoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Service category '{id}' was not found.");

        category.IsApproved = true;

        serviceCategoryRepository.Update(category);
        await serviceCategoryRepository.SaveChangesAsync();

        return category.ToResponse();
    }

    public async Task<ServiceCategoryResponse> UpdateAsync(int id, UpdateServiceCategoryRequest request)
    {
        var category = await serviceCategoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Service category '{id}' was not found.");

        // Re-translate whenever the name or description actually changes, so all three
        // languages stay in sync with each other rather than only updating one.
        if (request.Name is not null || request.Description is not null)
        {
            var nameToTranslate = request.Name ?? category.NameEn;
            var descriptionToTranslate = request.Description ?? category.DescriptionEn;
            var translation = await translationService.TranslateCategoryAsync(nameToTranslate, descriptionToTranslate);

            category.NameEn = translation.NameEn;
            category.NameMk = translation.NameMk;
            category.NameSq = translation.NameSq;
            category.DescriptionEn = translation.DescriptionEn;
            category.DescriptionMk = translation.DescriptionMk;
            category.DescriptionSq = translation.DescriptionSq;
        }

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