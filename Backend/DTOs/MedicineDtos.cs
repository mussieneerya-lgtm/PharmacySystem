using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateMedicineDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string GenericName { get; set; } = string.Empty;

    [Required]
    public string Manufacturer { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; }

    public bool RequiresPrescription { get; set; } = false;

    public string DosageForm { get; set; } = string.Empty;

    public string Strength { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiryDate { get; set; }
}

public class UpdateMedicineDto
{
    public string? Name { get; set; }
    public string? GenericName { get; set; }
    public string? Manufacturer { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public bool? RequiresPrescription { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class MedicineDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool RequiresPrescription { get; set; }
    public string DosageForm { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public int PharmacyId { get; set; }
    public string PharmacyName { get; set; } = string.Empty;

    // ── Computed alert flags ───────────────────────────────────────────────
    /// <summary>True when stock falls below 10 units.</summary>
    public bool IsLowStock => StockQuantity < 10;

    /// <summary>True when the medicine expires within the next 30 days.</summary>
    public bool IsExpiringSoon => ExpiryDate <= DateTime.UtcNow.AddDays(30);
}

public class MedicineSearchDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? City { get; set; }
    public bool? RequiresPrescription { get; set; }
    public decimal? MaxPrice { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
