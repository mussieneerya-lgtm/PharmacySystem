using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.DTOs;

public class CreatePrescriptionDto
{
    [Required]
    public string PatientName { get; set; } = string.Empty;

    [Required, Phone]
    public string PatientPhone { get; set; } = string.Empty;

    [Required]
    public string DoctorName { get; set; } = string.Empty;

    public string Notes { get; set; } = string.Empty;

    [Required]
    public int PharmacyId { get; set; }

    [Required, MinLength(1)]
    public List<CreatePrescriptionItemDto> Items { get; set; } = new();
}

public class CreatePrescriptionItemDto
{
    [Required]
    public int MedicineId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string Instructions { get; set; } = string.Empty;
}

public class UpdatePrescriptionStatusDto
{
    [Required]
    public PrescriptionStatus Status { get; set; }
}

public class PrescriptionDto
{
    public int Id { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime? FilledDate { get; set; }
    public int PharmacyId { get; set; }
    public string PharmacyName { get; set; } = string.Empty;
    public string IssuedByUserName { get; set; } = string.Empty;
    public List<PrescriptionItemDto> Items { get; set; } = new();
}

public class PrescriptionItemDto
{
    public int Id { get; set; }
    public int MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Instructions { get; set; } = string.Empty;
}
