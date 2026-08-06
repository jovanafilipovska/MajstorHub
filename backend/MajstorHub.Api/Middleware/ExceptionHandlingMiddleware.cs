using System.Net;
using MajstorHub.Api.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace MajstorHub.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, title) = ex switch
            {
                NotFoundException => (HttpStatusCode.NotFound, "Not Found"),
                ConflictException => (HttpStatusCode.Conflict, "Conflict"),
                ForbiddenException => (HttpStatusCode.Forbidden, "Forbidden"),
                UnauthorizedException => (HttpStatusCode.Unauthorized, "Unauthorized"),
                InvalidTransitionException => (HttpStatusCode.BadRequest, "Invalid Operation"),
                ValidationException => (HttpStatusCode.BadRequest, "Validation Error"),
                _ => (HttpStatusCode.InternalServerError, "Internal Server Error")
            };

            if (statusCode == HttpStatusCode.InternalServerError)
            {
                logger.LogError(ex, "Unhandled exception");
            }

            var problemDetails = new ProblemDetails
            {
                Status = (int)statusCode,
                Title = title,
                Detail = ex.Message
            };

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)statusCode;
            await context.Response.WriteAsJsonAsync(problemDetails);
        }
    }
}
