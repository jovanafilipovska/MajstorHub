using MajstorHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MajstorHub.Api.Data;

public class MajstorHubDbContext : DbContext
{
    public MajstorHubDbContext(DbContextOptions<MajstorHubDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<CraftsmanProfile> CraftsmanProfiles => Set<CraftsmanProfile>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("postgis");

        ConfigureUser(modelBuilder);
        ConfigureCraftsmanProfile(modelBuilder);
        ConfigureServiceCategory(modelBuilder);
        ConfigureBooking(modelBuilder);
        ConfigureReview(modelBuilder);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(256).IsRequired();
            entity.Property(u => u.PhoneNumber).HasMaxLength(30);
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(u => u.Email).IsUnique();
        });
    }

    private static void ConfigureCraftsmanProfile(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CraftsmanProfile>(entity =>
        {
            entity.HasKey(c => c.UserId);
            entity.Property(c => c.Bio).HasMaxLength(1000);
            entity.Property(c => c.HourlyRate).HasColumnType("decimal(10,2)");
            entity.Property(c => c.AddressText).HasMaxLength(300);
            entity.Property(c => c.Location).HasColumnType("geography (point, 4326)");
            entity.HasIndex(c => c.Location).HasMethod("GIST");

            entity.HasOne(c => c.User)
                .WithOne(u => u.CraftsmanProfile)
                .HasForeignKey<CraftsmanProfile>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.ServiceCategory)
                .WithMany(s => s.CraftsmanProfiles)
                .HasForeignKey(c => c.ServiceCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureServiceCategory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ServiceCategory>(entity =>
        {
            entity.Property(s => s.Name).HasMaxLength(100).IsRequired();
            entity.Property(s => s.Description).HasMaxLength(500);
            entity.HasIndex(s => s.Name).IsUnique();

            entity.HasData(
                new ServiceCategory { Id = 1, Name = "Electrician", Description = "Electrical installation and repair" },
                new ServiceCategory { Id = 2, Name = "Plumber", Description = "Plumbing installation and repair" },
                new ServiceCategory { Id = 3, Name = "Carpenter", Description = "Woodwork and furniture" },
                new ServiceCategory { Id = 4, Name = "Painter", Description = "Interior and exterior painting" },
                new ServiceCategory { Id = 5, Name = "Cleaner", Description = "Home and office cleaning" }
            );
        });
    }

    private static void ConfigureBooking(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(b => b.Description).HasMaxLength(1000).IsRequired();
            entity.Property(b => b.Address).HasMaxLength(300).IsRequired();
            entity.Property(b => b.PriceQuote).HasColumnType("decimal(10,2)");
            entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);

            entity.HasOne(b => b.Client)
                .WithMany(u => u.BookingsAsClient)
                .HasForeignKey(b => b.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.CraftsmanProfile)
                .WithMany(c => c.Bookings)
                .HasForeignKey(b => b.CraftsmanProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.ServiceCategory)
                .WithMany()
                .HasForeignKey(b => b.ServiceCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureReview(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(r => r.Comment).HasMaxLength(1000);
            entity.HasIndex(r => r.BookingId).IsUnique();

            entity.HasOne(r => r.Booking)
                .WithOne(b => b.Review)
                .HasForeignKey<Review>(r => r.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Reviewer)
                .WithMany(u => u.ReviewsWritten)
                .HasForeignKey(r => r.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.CraftsmanProfile)
                .WithMany(c => c.Reviews)
                .HasForeignKey(r => r.CraftsmanProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
