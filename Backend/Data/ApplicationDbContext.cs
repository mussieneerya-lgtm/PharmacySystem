using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Pharmacy> Pharmacies => Set<Pharmacy>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ──────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.FullName).HasMaxLength(200).IsRequired();
            e.Property(u => u.Email).HasMaxLength(200).IsRequired();
            e.Property(u => u.Role).HasMaxLength(50).IsRequired();
            e.Property(u => u.Phone).HasMaxLength(30);
            e.Property(u => u.LogoUrl).HasMaxLength(500);
        });

        // ── Pharmacy ──────────────────────────────────────────────────────
        modelBuilder.Entity<Pharmacy>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.LicenseNumber).IsUnique();
            e.Property(p => p.Name).HasMaxLength(300).IsRequired();
            e.Property(p => p.LicenseNumber).HasMaxLength(100).IsRequired();
            e.Property(p => p.Address).HasMaxLength(500).IsRequired();
            e.Property(p => p.City).HasMaxLength(100).IsRequired();
            e.Property(p => p.Phone).HasMaxLength(30).IsRequired();
            e.Property(p => p.Email).HasMaxLength(200).IsRequired();
            e.Property(p => p.Status)
             .HasConversion<string>()
             .HasMaxLength(20);
            // Map coordinates — nullable until owner supplies them
            e.Property(p => p.Latitude);
            e.Property(p => p.Longitude);
            e.Property(p => p.IsOpen).HasDefaultValue(true);

            e.HasOne(p => p.Owner)
             .WithOne(u => u.Pharmacy)
             .HasForeignKey<Pharmacy>(p => p.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Medicine ──────────────────────────────────────────────────────
        modelBuilder.Entity<Medicine>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Name).HasMaxLength(300).IsRequired();
            e.Property(m => m.GenericName).HasMaxLength(300).IsRequired();
            e.Property(m => m.Manufacturer).HasMaxLength(300).IsRequired();
            e.Property(m => m.Category).HasMaxLength(100).IsRequired();
            e.Property(m => m.Price).HasPrecision(18, 2);

            e.HasOne(m => m.Pharmacy)
             .WithMany(p => p.Medicines)
             .HasForeignKey(m => m.PharmacyId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Prescription ──────────────────────────────────────────────────
        modelBuilder.Entity<Prescription>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Status)
             .HasConversion<string>()
             .HasMaxLength(20);

            e.HasOne(p => p.Pharmacy)
             .WithMany(ph => ph.Prescriptions)
             .HasForeignKey(p => p.PharmacyId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(p => p.IssuedByUser)
             .WithMany(u => u.Prescriptions)
             .HasForeignKey(p => p.IssuedByUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── PrescriptionItem ──────────────────────────────────────────────
        modelBuilder.Entity<PrescriptionItem>(e =>
        {
            e.HasKey(pi => pi.Id);

            e.HasOne(pi => pi.Prescription)
             .WithMany(p => p.Items)
             .HasForeignKey(pi => pi.PrescriptionId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(pi => pi.Medicine)
             .WithMany()
             .HasForeignKey(pi => pi.MedicineId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Seed admin user ───────────────────────────────────────────────
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            FullName = "System Admin",
            Email = "admin@pharmacy.com",
            // BCrypt hash of "Admin@123"
            PasswordHash = "$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            Role = "Admin",
            IsActive = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
