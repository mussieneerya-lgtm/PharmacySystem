namespace Backend.Models;

public class Medicine
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool RequiresPrescription { get; set; } = false;
    public string DosageForm { get; set; } = string.Empty;  // Tablet, Capsule, Syrup…
    public string Strength { get; set; } = string.Empty;    // e.g. 500mg
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // FK
    public int PharmacyId { get; set; }
    public Pharmacy Pharmacy { get; set; } = null!;
}
