using Microsoft.EntityFrameworkCore;
using MajstorHub.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<MajstorHubDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// No HTTPS redirect for now: this API is reached over plain HTTP from
// phones on the LAN (during Expo testing) and from the Docker container,
// neither of which trust the local dev HTTPS certificate.
app.UseAuthorization();

app.MapControllers();

app.Run();
