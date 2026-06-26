namespace Backend.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Pharmacist"; // Admin | Pharmacist | Customer
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Profile fields
    public string Phone { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;

    // Navigation
    public Pharmacy? Pharmacy { get; set; }
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
