using MajstorHub.Api.DTOs.ServiceCategories;

namespace MajstorHub.Api.Services.Interfaces;

public interface IServiceCategoryService
{
    Task<List<ServiceCategoryResponse>> GetAllAsync();
    Task<ServiceCategoryResponse> GetByIdAsync(int id);
    Task<ServiceCategoryResponse> CreateAsync(CreateServiceCategoryRequest request);
    Task<ServiceCategoryResponse> UpdateAsync(int id, UpdateServiceCategoryRequest request);
    Task DeleteAsync(int id);
}
