using MajstorHub.Api.DTOs.ServiceCategories;

namespace MajstorHub.Api.Services.Interfaces;

public interface IServiceCategoryService
{
    Task<List<ServiceCategoryResponse>> GetAllAsync();
    Task<List<ServiceCategoryResponse>> GetPendingAsync();
    Task<ServiceCategoryResponse> GetByIdAsync(int id);
    Task<ServiceCategoryResponse> CreateAsync(CreateServiceCategoryRequest request);
    Task<ServiceCategoryResponse> SuggestAsync(Guid userId, CreateServiceCategoryRequest request);
    Task<ServiceCategoryResponse> ApproveAsync(int id);
    Task<ServiceCategoryResponse> UpdateAsync(int id, UpdateServiceCategoryRequest request);
    Task DeleteAsync(int id);
}
