using System.Text.Json;
using MajstorHub.Api.Ai;
using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services.Chatbot;

public class ChatbotToolService(
    ICraftsmanProfileService craftsmanProfileService,
    ICraftsmanProfileRepository craftsmanProfileRepository,
    IBookingRepository bookingRepository,
    IReviewRepository reviewRepository,
    IFavoriteService favoriteService) : IChatbotToolService
{
    private const int MaxResults = 5;
    private const double DefaultRadiusKm = 25;
    private const int MinSampleForConfidentEstimate = 3;

    public List<GroqToolDefinition> GetToolDefinitions(ChatbotMode mode)
    {
        var tools = new List<GroqToolDefinition>
        {
            new()
            {
                Name = "search_craftsmen",
                Description = "Find craftsmen for a given service category, ranked by rating, distance, and price. " +
                              "Call this whenever the user describes a problem you can map to a category id.",
                Parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        categoryId = new { type = "integer", description = "The service category id that best matches the problem." },
                        radiusKm = new { type = "number", description = "Search radius in kilometers. Defaults to 25." }
                    },
                    required = new[] { "categoryId" }
                }
            },
            new()
            {
                Name = "estimate_cost",
                Description = "Get a real price range for a job in a given category, based on completed bookings " +
                              "and craftsmen's hourly rates. Always call this before quoting any price to the user.",
                Parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        categoryId = new { type = "integer", description = "The service category id for the job." },
                        jobDescription = new { type = "string", description = "Short description of the job, for context only." }
                    },
                    required = new[] { "categoryId" }
                }
            }
        };

        var bookingsToolDescription = mode == ChatbotMode.Craftsman
            ? "List the caller's bookings with the client's name, status, and job details. Use this to answer " +
              "questions about a specific client or reservation - e.g. who left a review, whose booking was " +
              "cancelled or accepted, or what's coming up next."
            : "List the caller's own bookings with the craftsman's name, status, and job details. Use this to " +
              "answer questions like who they booked, the status/price of a booking, or what's scheduled next.";
        tools.Add(new GroqToolDefinition
        {
            Name = "get_my_bookings",
            Description = bookingsToolDescription,
            Parameters = new
            {
                type = "object",
                properties = new
                {
                    status = new
                    {
                        type = "string",
                        @enum = new[] { "Pending", "Accepted", "Rejected", "Completed", "Cancelled" },
                        description = "Filter to bookings with this status. Omit to list all statuses."
                    },
                    maxResults = new { type = "integer", description = "Max bookings to return. Defaults to 20." }
                }
            }
        });

        if (mode == ChatbotMode.Client)
        {
            tools.Add(new GroqToolDefinition
            {
                Name = "get_my_favorites",
                Description = "List the craftsmen the caller has saved as favorites, with their category, rating, and hourly rate.",
                Parameters = new { type = "object", properties = new { } }
            });
        }

        if (mode == ChatbotMode.Craftsman)
        {
            tools.Add(new GroqToolDefinition
            {
                Name = "get_my_craftsman_stats",
                Description = "Get the caller's own craftsman profile stats: rating, review count, profile views, " +
                              "verification status, hourly rate, and booking counts by status.",
                Parameters = new { type = "object", properties = new { } }
            });
            tools.Add(new GroqToolDefinition
            {
                Name = "get_my_recent_reviews",
                Description = "Get the caller's most recent reviews, including the rating, comment, and the name of " +
                              "the client who left each one.",
                Parameters = new { type = "object", properties = new { } }
            });
            tools.Add(new GroqToolDefinition
            {
                Name = "suggest_quote",
                Description = "Get real historical price data for a category plus the caller's own hourly rate and " +
                              "experience, to help them price an incoming job.",
                Parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        categoryId = new { type = "integer", description = "The service category id for the job being quoted." },
                        jobDescription = new { type = "string", description = "Short description of the job, for context only." }
                    },
                    required = new[] { "categoryId" }
                }
            });
        }

        return tools;
    }

    public async Task<ChatbotToolExecutionResult> ExecuteAsync(string toolName, string argumentsJson, ChatbotToolContext context, CancellationToken ct = default)
    {
        var args = ParseArgs(argumentsJson);

        return toolName switch
        {
            "search_craftsmen" => await SearchCraftsmenAsync(args, context),
            "estimate_cost" => new ChatbotToolExecutionResult(await EstimateCostAsync(args)),
            "get_my_craftsman_stats" => new ChatbotToolExecutionResult(await GetMyCraftsmanStatsAsync(context)),
            "get_my_recent_reviews" => new ChatbotToolExecutionResult(await GetMyRecentReviewsAsync(context)),
            "get_my_bookings" => new ChatbotToolExecutionResult(await GetMyBookingsAsync(args, context)),
            "get_my_favorites" => await GetMyFavoritesAsync(context),
            "suggest_quote" => new ChatbotToolExecutionResult(await SuggestQuoteAsync(args, context)),
            _ => new ChatbotToolExecutionResult(new { error = $"Unknown tool '{toolName}'." })
        };
    }

    private async Task<ChatbotToolExecutionResult> SearchCraftsmenAsync(JsonElement args, ChatbotToolContext context)
    {
        var categoryId = GetInt(args, "categoryId");
        if (categoryId is null) return new ChatbotToolExecutionResult(new { error = "categoryId is required." });
        var radiusKm = GetDouble(args, "radiusKm") ?? DefaultRadiusKm;

        var usedLocation = context.Latitude is not null && context.Longitude is not null;
        List<CraftsmanProfileResponse> profiles;
        if (usedLocation)
        {
            var nearby = await craftsmanProfileService.SearchNearbyAsync(context.Latitude!.Value, context.Longitude!.Value, radiusKm);
            profiles = nearby.Where(p => p.ServiceCategoryId == categoryId).ToList();
        }
        else
        {
            profiles = await craftsmanProfileService.GetByCategoryAsync(categoryId.Value);
        }

        // A craftsman with no pinned location is invisible to the nearby query
        // above even if they're a perfect category match (e.g. they only set a
        // free-text address). Rather than report nobody exists, widen to a
        // category-only search and flag it so the model can be upfront that
        // these results aren't confirmed nearby.
        var expandedSearchBeyondNearby = false;
        if (usedLocation && profiles.Count == 0)
        {
            profiles = await craftsmanProfileService.GetByCategoryAsync(categoryId.Value);
            expandedSearchBeyondNearby = profiles.Count > 0;
        }

        var ranked = profiles
            .OrderByDescending(p => p.AverageRating ?? 0)
            .ThenBy(p => DistanceKmOrNull(context, p) ?? double.MaxValue)
            .ThenBy(p => p.HourlyRate)
            .Take(MaxResults)
            .ToList();

        var forModel = ranked.Select(p => new
        {
            userId = p.UserId,
            name = p.FullName,
            businessName = p.BusinessName,
            averageRating = p.AverageRating,
            reviewCount = p.ReviewCount,
            hourlyRate = p.HourlyRate,
            currency = "$",
            distanceKm = DistanceKmOrNull(context, p) is { } d ? Math.Round(d, 1) : (double?)null,
            isVerified = p.IsVerified,
            yearsOfExperience = p.YearsOfExperience,
            address = p.AddressText
        }).ToList();

        return new ChatbotToolExecutionResult(
            new
            {
                locationUsed = usedLocation && !expandedSearchBeyondNearby,
                expandedSearchBeyondNearby,
                resultCount = forModel.Count,
                craftsmen = forModel
            },
            ranked);
    }

    private async Task<object> EstimateCostAsync(JsonElement args)
    {
        var categoryId = GetInt(args, "categoryId");
        if (categoryId is null) return new { error = "categoryId is required." };

        return await BuildCostEstimateAsync(categoryId.Value);
    }

    private async Task<object> SuggestQuoteAsync(JsonElement args, ChatbotToolContext context)
    {
        var categoryId = GetInt(args, "categoryId");
        if (categoryId is null) return new { error = "categoryId is required." };

        var estimate = await BuildCostEstimateAsync(categoryId.Value);
        var myProfile = await craftsmanProfileRepository.GetByUserIdAsync(context.UserId);

        return new
        {
            marketEstimate = estimate,
            myHourlyRate = myProfile?.HourlyRate,
            myYearsOfExperience = myProfile?.YearsOfExperience,
            currency = "$"
        };
    }

    private async Task<object> BuildCostEstimateAsync(int categoryId)
    {
        var completed = await bookingRepository.GetCompletedByCategoryAsync(categoryId);
        var prices = completed.Select(b => b.PriceQuote!.Value).ToList();

        if (prices.Count >= MinSampleForConfidentEstimate)
        {
            return new
            {
                currency = "$",
                minPrice = prices.Min(),
                avgPrice = Math.Round(prices.Average(), 2),
                maxPrice = prices.Max(),
                sampleSize = prices.Count,
                confidence = "high",
                source = "completed_bookings"
            };
        }

        var craftsmen = await craftsmanProfileService.GetByCategoryAsync(categoryId);
        if (prices.Count == 0 && craftsmen.Count == 0)
        {
            return new { sampleSize = 0, confidence = "none", note = "No historical price data or craftsmen found for this category yet." };
        }

        return new
        {
            currency = "$",
            minPrice = prices.Count > 0 ? prices.Min() : (decimal?)null,
            avgPrice = prices.Count > 0 ? Math.Round(prices.Average(), 2) : (decimal?)null,
            maxPrice = prices.Count > 0 ? prices.Max() : (decimal?)null,
            sampleSize = prices.Count,
            averageHourlyRateInCategory = craftsmen.Count > 0 ? Math.Round(craftsmen.Average(c => c.HourlyRate), 2) : (decimal?)null,
            confidence = "low",
            source = "thin_sample_blended_with_hourly_rates",
            note = "Low sample size - present this as a rough ballpark, not a firm quote."
        };
    }

    private async Task<object> GetMyCraftsmanStatsAsync(ChatbotToolContext context)
    {
        var profile = await craftsmanProfileRepository.GetByUserIdAsync(context.UserId);
        if (profile is null) return new { error = "No craftsman profile found for this user." };

        var bookings = await bookingRepository.GetByCraftsmanProfileIdAsync(context.UserId);
        var reviews = await reviewRepository.GetByCraftsmanProfileIdAsync(context.UserId);

        return new
        {
            businessName = profile.BusinessName,
            hourlyRate = profile.HourlyRate,
            currency = "$",
            yearsOfExperience = profile.YearsOfExperience,
            isVerified = profile.IsVerified,
            isAvailable = profile.IsAvailable,
            viewCount = profile.ViewCount,
            averageRating = reviews.Count > 0 ? Math.Round(reviews.Average(r => r.Rating), 2) : (double?)null,
            reviewCount = reviews.Count,
            bookingCounts = bookings
                .GroupBy(b => b.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count())
        };
    }

    private async Task<object> GetMyRecentReviewsAsync(ChatbotToolContext context)
    {
        var reviews = await reviewRepository.GetByCraftsmanProfileIdAsync(context.UserId);
        var recent = reviews
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new { clientName = r.Reviewer.FullName, rating = r.Rating, comment = r.Comment, createdAt = r.CreatedAt })
            .ToList();

        return new { reviewCount = reviews.Count, recentReviews = recent };
    }

    private async Task<object> GetMyBookingsAsync(JsonElement args, ChatbotToolContext context)
    {
        var statusFilter = GetString(args, "status");
        var maxResults = GetInt(args, "maxResults") ?? 20;

        var bookings = context.Mode == ChatbotMode.Craftsman
            ? await bookingRepository.GetByCraftsmanProfileIdAsync(context.UserId)
            : await bookingRepository.GetByClientIdAsync(context.UserId);

        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<BookingStatus>(statusFilter, true, out var status))
        {
            bookings = bookings.Where(b => b.Status == status).ToList();
        }

        var results = bookings
            .OrderByDescending(b => b.CreatedAt)
            .Take(maxResults)
            .Select(b => new
            {
                otherPartyName = context.Mode == ChatbotMode.Craftsman ? b.Client.FullName : b.CraftsmanProfile.User.FullName,
                status = b.Status.ToString(),
                serviceCategoryName = b.ServiceCategory.Name,
                description = b.Description,
                address = b.Address,
                scheduledAt = b.ScheduledAt,
                priceQuote = b.PriceQuote,
                currency = "$",
                hasReview = b.Review is not null,
                createdAt = b.CreatedAt
            })
            .ToList();

        return new { resultCount = results.Count, bookings = results };
    }

    private async Task<ChatbotToolExecutionResult> GetMyFavoritesAsync(ChatbotToolContext context)
    {
        var favorites = await favoriteService.GetMyFavoritesAsync(context.UserId);
        var forModel = favorites
            .Select(f => new
            {
                userId = f.UserId,
                name = f.FullName,
                businessName = f.BusinessName,
                serviceCategoryName = f.ServiceCategoryName,
                averageRating = f.AverageRating,
                reviewCount = f.ReviewCount,
                hourlyRate = f.HourlyRate,
                currency = "$",
                isVerified = f.IsVerified
            })
            .ToList();

        return new ChatbotToolExecutionResult(new { resultCount = forModel.Count, favorites = forModel }, favorites);
    }

    private static double? DistanceKmOrNull(ChatbotToolContext context, CraftsmanProfileResponse profile)
    {
        if (context.Latitude is null || context.Longitude is null || profile.Latitude is null || profile.Longitude is null)
        {
            return null;
        }

        return HaversineKm(context.Latitude.Value, context.Longitude.Value, profile.Latitude.Value, profile.Longitude.Value);
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    private static JsonElement ParseArgs(string argumentsJson)
    {
        if (string.IsNullOrWhiteSpace(argumentsJson)) return default;
        using var doc = JsonDocument.Parse(argumentsJson);
        return doc.RootElement.Clone();
    }

    private static int? GetInt(JsonElement args, string propertyName)
    {
        if (args.ValueKind != JsonValueKind.Object || !args.TryGetProperty(propertyName, out var value)) return null;
        return value.ValueKind switch
        {
            JsonValueKind.Number => value.GetInt32(),
            JsonValueKind.String when int.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static string? GetString(JsonElement args, string propertyName)
    {
        if (args.ValueKind != JsonValueKind.Object || !args.TryGetProperty(propertyName, out var value)) return null;
        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static double? GetDouble(JsonElement args, string propertyName)
    {
        if (args.ValueKind != JsonValueKind.Object || !args.TryGetProperty(propertyName, out var value)) return null;
        return value.ValueKind switch
        {
            JsonValueKind.Number => value.GetDouble(),
            JsonValueKind.String when double.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }
}