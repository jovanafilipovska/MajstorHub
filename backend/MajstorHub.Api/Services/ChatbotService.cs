using System.Text;
using System.Text.Json;
using MajstorHub.Api.Ai;
using MajstorHub.Api.DTOs.Chatbot;
using MajstorHub.Api.DTOs.Craftsmen;
using MajstorHub.Api.Exceptions;
using MajstorHub.Api.Mappings;
using MajstorHub.Api.Models;
using MajstorHub.Api.Models.Enums;
using MajstorHub.Api.Repositories.Interfaces;
using MajstorHub.Api.Services.Chatbot;
using MajstorHub.Api.Services.Interfaces;

namespace MajstorHub.Api.Services;

public class ChatbotService(
    IChatbotRepository chatbotRepository,
    IUserRepository userRepository,
    ICraftsmanProfileRepository craftsmanProfileRepository,
    IServiceCategoryRepository serviceCategoryRepository,
    IGroqClient groqClient,
    IChatbotToolService chatbotToolService) : IChatbotService
{
    private const int MaxHistoryMessages = 20;
    private const int MaxToolIterations = 4;

    public async Task<ChatbotConversationResponse> GetConversationAsync(Guid userId, ChatbotMode mode)
    {
        var conversation = await chatbotRepository.GetConversationWithMessagesAsync(userId, mode);
        return new ChatbotConversationResponse
        {
            Messages = conversation?.Messages.OrderBy(m => m.CreatedAt).Select(m => m.ToResponse()).ToList() ?? []
        };
    }

    public async Task ResetConversationAsync(Guid userId, ChatbotMode mode)
    {
        var conversation = await chatbotRepository.GetConversationWithMessagesAsync(userId, mode);
        if (conversation is null) return;
        await chatbotRepository.ClearMessagesAsync(conversation.Id);
    }

    public async Task<ChatbotMessageResponse> SendMessageAsync(
        Guid userId, ChatbotMode mode, string message, double? latitude, double? longitude, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ValidationException("Message cannot be empty.");
        }

        CraftsmanProfile? craftsmanProfile = null;
        if (mode == ChatbotMode.Craftsman)
        {
            craftsmanProfile = await craftsmanProfileRepository.GetByUserIdAsync(userId)
                ?? throw new ForbiddenException("You need a craftsman profile to use the craftsman assistant.");
        }

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException($"User '{userId}' was not found.");

        var conversation = await GetOrCreateConversationAsync(userId, mode);

        var userMessage = new ChatbotMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = ChatbotMessageRole.User,
            Content = message.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        await chatbotRepository.AddMessageAsync(userMessage);
        await chatbotRepository.SaveChangesAsync();
        conversation.Messages.Add(userMessage);

        var categories = await serviceCategoryRepository.GetApprovedAsync();
        var systemPrompt = BuildSystemPrompt(mode, categories, user, craftsmanProfile);

        var groqMessages = new List<GroqMessage> { new() { Role = "system", Content = systemPrompt } };
        groqMessages.AddRange(
            conversation.Messages
                .OrderBy(m => m.CreatedAt)
                .TakeLast(MaxHistoryMessages)
                .Select(m => new GroqMessage
                {
                    Role = m.Role == ChatbotMessageRole.User ? "user" : "assistant",
                    Content = m.Content
                }));

        var toolDefinitions = chatbotToolService.GetToolDefinitions(mode);
        var toolContext = new ChatbotToolContext(userId, mode, latitude, longitude);

        var (finalContent, suggestions) = await RunToolCallingLoopAsync(groqMessages, toolDefinitions, toolContext, ct);

        var assistantMessage = new ChatbotMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = ChatbotMessageRole.Assistant,
            Content = finalContent.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        await chatbotRepository.AddMessageAsync(assistantMessage);
        conversation.UpdatedAt = DateTimeOffset.UtcNow;
        chatbotRepository.Update(conversation);
        await chatbotRepository.SaveChangesAsync();

        var response = assistantMessage.ToResponse();
        response.Suggestions = suggestions;
        return response;
    }

    private async Task<(string Content, List<CraftsmanProfileResponse>? Suggestions)> RunToolCallingLoopAsync(
        List<GroqMessage> groqMessages, List<GroqToolDefinition> toolDefinitions, ChatbotToolContext toolContext, CancellationToken ct)
    {
        List<CraftsmanProfileResponse>? latestSuggestions = null;

        for (var iteration = 0; iteration < MaxToolIterations; iteration++)
        {
            var result = await groqClient.CompleteAsync(groqMessages, toolDefinitions, ct);

            if (result.ToolCalls.Count == 0)
            {
                var content = result.Content ?? "Sorry, I couldn't come up with an answer just now - could you try rephrasing that?";
                return (content, latestSuggestions);
            }

            groqMessages.Add(new GroqMessage { Role = "assistant", Content = result.Content, ToolCalls = result.ToolCalls });

            foreach (var toolCall in result.ToolCalls)
            {
                var toolResult = await chatbotToolService.ExecuteAsync(toolCall.Function.Name, toolCall.Function.Arguments, toolContext, ct);
                if (toolResult.Suggestions is not null)
                {
                    latestSuggestions = toolResult.Suggestions;
                }

                groqMessages.Add(new GroqMessage
                {
                    Role = "tool",
                    ToolCallId = toolCall.Id,
                    Content = JsonSerializer.Serialize(toolResult.ForModel)
                });
            }
        }

        return ("I looked into that but I'm having trouble pulling everything together right now - please try asking again.", latestSuggestions);
    }

    private async Task<ChatbotConversation> GetOrCreateConversationAsync(Guid userId, ChatbotMode mode)
    {
        var existing = await chatbotRepository.GetConversationWithMessagesAsync(userId, mode);
        if (existing is not null) return existing;

        var conversation = new ChatbotConversation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Mode = mode,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await chatbotRepository.AddAsync(conversation);
        await chatbotRepository.SaveChangesAsync();
        return conversation;
    }

    private static string BuildSystemPrompt(ChatbotMode mode, List<ServiceCategory> categories, User user, CraftsmanProfile? craftsmanProfile)
    {
        var categoryList = string.Join(", ", categories.Select(c => $"{c.Id}={c.NameEn}"));

        var sb = new StringBuilder();
        sb.AppendLine("Any scheduledAt/createdAt timestamps returned by tools are already converted to the user's local time " +
                      "zone (Central European Time) - report them as-is and never add/subtract hours or mention UTC.");
        if (mode == ChatbotMode.Client)
        {
            var location = string.Join(", ", new[] { user.Street, user.City, user.Country }.Where(p => !string.IsNullOrWhiteSpace(p)));
            sb.AppendLine("You are the MajstorHub assistant, helping a client find the right craftsman (majstor) for a home repair " +
                          "or improvement job, and giving them a realistic cost estimate.");
            sb.AppendLine($"Available service categories (id=name): {categoryList}. Map the client's problem to the closest " +
                          "categoryId yourself - never ask them to pick a numeric id.");
            sb.AppendLine(string.IsNullOrWhiteSpace(location)
                ? "The client has no saved address on file - if their location matters for the search, ask for their city or area."
                : $"The client's saved address is: {location}.");
            sb.AppendLine("Rules:");
            sb.AppendLine("- First work out what the client actually wants:");
            sb.AppendLine("  1) They describe a problem/job and want a craftsman and/or a price -> use search_craftsmen and estimate_cost.");
            sb.AppendLine("  2) They ask about THEIR OWN bookings (who they booked, status, price, schedule) -> use get_my_bookings.");
            sb.AppendLine("  3) They ask about their favorites/saved pros -> use get_my_favorites.");
            sb.AppendLine("  4) They ask how to do something in the app (e.g. \"how do I book\", \"how do I leave a review\") -> answer directly " +
                          "from the app guide below in 1-3 sentences. Do NOT call any tool for this, and do NOT phrase it like a recommendation " +
                          "(never say things like \"I found...\" or \"the estimated cost is...\" for a how-to question).");
            sb.AppendLine("- Always call search_craftsmen before recommending anyone by name. Never invent a craftsman, rating, or price.");
            sb.AppendLine("- Call search_craftsmen FRESH every time the client asks to find/suggest a craftsman, even if an earlier turn in this " +
                          "conversation already searched that category or said nobody was found. Never answer \"no one found\" from memory - " +
                          "only say that after actually calling the tool this turn and getting an empty result.");
            sb.AppendLine("- Always call estimate_cost before stating a price. If its confidence is 'low', say the estimate is rough.");
            sb.AppendLine("- If a tool result has locationUsed=false, mention you're showing category-only results and ask for their area.");
            sb.AppendLine("- If a tool result has expandedSearchBeyondNearby=true, say upfront that nobody matched nearby so you widened the search - " +
                          "these results aren't confirmed close by (mention their listed address instead of a distance).");
            sb.AppendLine("- Keep replies short and conversational. For recommendations, present at most the top 3-5 craftsmen with rating, price, and distance if known.");
            sb.AppendLine("- If asked to compare craftsmen, only use names/details already returned by search_craftsmen in this conversation - never invent a comparison.");
            sb.AppendLine("- If the client describes problems spanning more than one trade, call search_craftsmen/estimate_cost separately for each relevant categoryId.");
            sb.AppendLine("- Craftsman verification (the \"Verified\" badge) is granted by MajstorHub admins after review - there is no in-app way to request it. Say so if asked, don't guess.");
            sb.AppendLine("- You can also help the client use the app itself. Only mention features from this list - never invent one:");
            sb.AppendLine("  Browse tab: search/filter craftsmen by category, with Near You / Recommended / New sections; tap a craftsman for their profile.");
            sb.AppendLine("  Craftsman profile: bio, hourly rate, reviews, a favorite (heart) toggle, and a \"Book This Craftsman\" button.");
            sb.AppendLine("  Booking a job: pin the job location (or use current GPS), describe the problem, optionally attach photos, pick a time, then confirm.");
            sb.AppendLine("  Profile tab: Favorites (saved pros), Booking history, and Settings (edit name/address/phone, change password, delete account).");
            sb.AppendLine("  A completed booking's detail screen has a \"Leave a Review\" button. An Accepted booking can be cancelled from its Booking Detail screen (Cancel Booking button) any time before it's completed.");
            sb.AppendLine("  Messages tab: chat with a craftsman about a specific booking.");
        }
        else
        {
            sb.AppendLine("You are the MajstorHub assistant, acting as a business copilot for a craftsman (majstor) user - helping " +
                          "them price incoming jobs, understand their own performance, and improve.");
            sb.AppendLine($"Available service categories (id=name): {categoryList}.");
            sb.AppendLine(craftsmanProfile is not null
                ? $"Their current hourly rate is {craftsmanProfile.HourlyRate} and their category is id {craftsmanProfile.ServiceCategoryId}."
                : string.Empty);
            sb.AppendLine("Rules:");
            sb.AppendLine("- Use get_my_craftsman_stats for questions about their overall rating, profile views, verification, or booking counts by status.");
            sb.AppendLine("- Use get_my_bookings or get_my_recent_reviews whenever they ask about a specific client or reservation by name or " +
                          "circumstance (e.g. who left a review, whose booking was cancelled/accepted, what's scheduled next). Never invent a client name.");
            sb.AppendLine("- Use suggest_quote before recommending a price for a job. Never invent a number.");
            sb.AppendLine("- Keep replies short, practical, and encouraging but honest.");
            sb.AppendLine("- Verification (the \"Verified\" badge) is granted by MajstorHub admins after review - there is no in-app way to request it. Say so if asked, don't guess.");
            sb.AppendLine("- You can also help them use the app itself. Only mention features from this list - never invent one:");
            sb.AppendLine("  Dashboard tab: today/this week stats, current rating, an availability toggle, and incoming requests to accept or decline.");
            sb.AppendLine("  Bookings tab: manage all bookings (accept, reject, complete). An Accepted booking can also be cancelled, any time before it's completed.");
            sb.AppendLine("  Profile tab: edit the business profile (category, hourly rate, bio, years of experience, service area/location, photo).");
            sb.AppendLine("  Messages tab: chat with clients about a specific booking. Settings tab: account settings.");
        }

        return sb.ToString();
    }
}