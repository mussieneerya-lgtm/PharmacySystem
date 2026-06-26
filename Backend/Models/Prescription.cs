namespace Backend.Models;

public class Prescription
{
    public int Id { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public PrescriptionStatus Status { get; set; } = PrescriptionStatus.Pending;
    public DateTime IssuedDate { get; set; } = DateTime.UtcNow;
    public DateTime? FilledDate { get; set; }

    // FK
    public int PharmacyId { get; set; }
    public Pharmacy Pharmacy { get; set; } = null!;

    public int IssuedByUserId { get; set; }
    public User IssuedByUser { get; set; } = null!;

    // Navigation
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}

public class PrescriptionItem
{
    public int Id { get; set; }
    public int Quantity { get; set; }
    public string Instructions { get; set; } = string.Empty;

    // FK
    public int PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;

    public int MedicineId { get; set; }
    public Medicine Medicine { get; set; } = null!;
}

public enum PrescriptionStatus
{
    Pending,
    Filled,
    Cancelled
}
