using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrescriptionController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PrescriptionController(ApplicationDbContext db) => _db = db;

    private int CurrentUserId =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
               ?? "0");

    private string CurrentRole =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;

    // ── GET: List prescriptions (Admin sees all, Pharmacist sees their pharmacy, Customer sees own) ──
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        IQueryable<Prescription> query = _db.Prescriptions
            .Include(p => p.Pharmacy)
            .Include(p => p.IssuedByUser)
            .Include(p => p.Items)
                .ThenInclude(i => i.Medicine);

        if (CurrentRole == "Pharmacist")
        {
            var pharmacy = await _db.Pharmacies.FirstOrDefaultAsync(p => p.OwnerId == CurrentUserId);
            if (pharmacy is null) return Ok(new List<PrescriptionDto>());
            query = query.Where(p => p.PharmacyId == pharmacy.Id);
        }
        else if (CurrentRole == "Customer")
        {
            query = query.Where(p => p.IssuedByUserId == CurrentUserId);
        }
        // Admin sees everything

        var list = await query
            .OrderByDescending(p => p.IssuedDate)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return Ok(list);
    }

    // ── GET: Single prescription ──────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Prescriptions
            .Include(x => x.Pharmacy)
            .Include(x => x.IssuedByUser)
            .Include(x => x.Items)
                .ThenInclude(i => i.Medicine)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p is null) return NotFound();

        // Access control: admin sees all, pharmacist sees own pharmacy, customer sees own
        if (CurrentRole == "Customer" && p.IssuedByUserId != CurrentUserId) return Forbid();
        if (CurrentRole == "Pharmacist")
        {
            var pharmacy = await _db.Pharmacies.FirstOrDefaultAsync(ph => ph.OwnerId == CurrentUserId);
            if (pharmacy is null || p.PharmacyId != pharmacy.Id) return Forbid();
        }

        return Ok(MapToDto(p));
    }

    // ── POST: Create prescription ─────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var pharmacy = await _db.Pharmacies.FindAsync(dto.PharmacyId);
        if (pharmacy is null || pharmacy.Status != RegistrationStatus.Approved)
            return BadRequest(new { message = "Target pharmacy not found or not approved." });

        // Validate all medicine IDs belong to the target pharmacy
        var medicineIds = dto.Items.Select(i => i.MedicineId).Distinct().ToList();
        var medicines = await _db.Medicines
            .Where(m => medicineIds.Contains(m.Id) && m.PharmacyId == dto.PharmacyId && m.IsActive)
            .ToListAsync();

        if (medicines.Count != medicineIds.Count)
            return BadRequest(new { message = "One or more medicines not found in this pharmacy." });

        var prescription = new Prescription
        {
            PatientName = dto.PatientName,
            PatientPhone = dto.PatientPhone,
            DoctorName = dto.DoctorName,
            Notes = dto.Notes,
            PharmacyId = dto.PharmacyId,
            IssuedByUserId = CurrentUserId,
            Items = dto.Items.Select(i => new PrescriptionItem
            {
                MedicineId = i.MedicineId,
                Quantity = i.Quantity,
                Instructions = i.Instructions
            }).ToList()
        };

        _db.Prescriptions.Add(prescription);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { prescription.Id });
    }

    // ── PATCH: Update prescription status (Pharmacist / Admin only) ───────
    [Authorize(Roles = "Pharmacist,Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePrescriptionStatusDto dto)
    {
        var prescription = await _db.Prescriptions
            .Include(p => p.Pharmacy)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prescription is null) return NotFound();

        if (CurrentRole == "Pharmacist")
        {
            var pharmacy = await _db.Pharmacies.FirstOrDefaultAsync(p => p.OwnerId == CurrentUserId);
            if (pharmacy is null || prescription.PharmacyId != pharmacy.Id)
                return Forbid();
        }

        prescription.Status = dto.Status;
        if (dto.Status == PrescriptionStatus.Filled)
            prescription.FilledDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { prescription.Id, Status = prescription.Status.ToString() });
    }

    // ── DELETE: Cancel own prescription ───────────────────────────────────
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var prescription = await _db.Prescriptions.FindAsync(id);
        if (prescription is null) return NotFound();

        if (CurrentRole != "Admin" && prescription.IssuedByUserId != CurrentUserId)
            return Forbid();

        if (prescription.Status == PrescriptionStatus.Filled)
            return BadRequest(new { message = "Cannot cancel a filled prescription." });

        prescription.Status = PrescriptionStatus.Cancelled;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helper: map entity → DTO ──────────────────────────────────────────
    private static PrescriptionDto MapToDto(Prescription p) => new()
    {
        Id = p.Id,
        PatientName = p.PatientName,
        PatientPhone = p.PatientPhone,
        DoctorName = p.DoctorName,
        Notes = p.Notes,
        Status = p.Status.ToString(),
        IssuedDate = p.IssuedDate,
        FilledDate = p.FilledDate,
        PharmacyId = p.PharmacyId,
        PharmacyName = p.Pharmacy?.Name ?? string.Empty,
        IssuedByUserName = p.IssuedByUser?.FullName ?? string.Empty,
        Items = p.Items.Select(i => new PrescriptionItemDto
        {
            Id = i.Id,
            MedicineId = i.MedicineId,
            MedicineName = i.Medicine?.Name ?? string.Empty,
            Quantity = i.Quantity,
            Instructions = i.Instructions
        }).ToList()
    };
}
