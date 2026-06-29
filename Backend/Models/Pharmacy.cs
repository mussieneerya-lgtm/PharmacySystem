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

    // ── Map coordinates ───────────────────────────────────────────────────
    /// <summary>Decimal degrees latitude, e.g. 9.0320. Null until set by owner.</summary>
    public double? Latitude { get; set; }

    /// <summary>Decimal degrees longitude, e.g. 38.7469. Null until set by owner.</summary>
    public double? Longitude { get; set; }

    /// <summary>Simple open/closed flag. Defaults to true.</summary>
    public bool IsOpen { get; set; } = true;

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
