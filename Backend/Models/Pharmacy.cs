namespace Backend.Models;

public class Pharmacy
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }

    // FK
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    // Navigation
    public ICollection<Medicine> Medicines { get; set; } = new List<Medicine>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}

public enum RegistrationStatus
{
    Pending,
    Approved,
    Rejected
}
