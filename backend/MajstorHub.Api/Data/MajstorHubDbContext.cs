using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Data;

public class MajstorHubDbContext : DbContext
{
    public MajstorHubDbContext(DbContextOptions<MajstorHubDbContext> options) : base(options)
    {
    }

    // DbSets for entities (Users, Services, Bookings, ...) will be added
    // once the data model is designed in a follow-up session.
}
