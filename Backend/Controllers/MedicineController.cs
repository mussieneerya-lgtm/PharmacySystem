using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MedicineController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public MedicineController(ApplicationDbContext db) => _db = db;

    private int CurrentUserId =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
               ?? "0");

    // ── Public: search / list medicines ──────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] MedicineSearchDto search)
    {
        var query = _db.Medicines
            .Include(m => m.Pharmacy)
            .Where(m => m.IsActive && m.Pharmacy.Status == RegistrationStatus.Approved)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search.Name))
            query = query.Where(m =>
                m.Name.Contains(search.Name) ||
                m.GenericName.Contains(search.Name));

        if (!string.IsNullOrWhiteSpace(search.Category))
            query = query.Where(m => m.Category.Contains(search.Category));

        if (!string.IsNullOrWhiteSpace(search.City))
            query = query.Where(m => m.Pharmacy.City.Contains(search.City));

        if (search.RequiresPrescription.HasValue)
            query = query.Where(m => m.RequiresPrescription == search.RequiresPrescription.Value);

        if (search.MaxPrice.HasValue)
            query = query.Where(m => m.Price <= search.MaxPrice.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(m => m.Name)
            .Skip((search.Page - 1) * search.PageSize)
            .Take(search.PageSize)
            .Select(m => new MedicineDto
            {
                Id = m.Id,
                Name = m.Name,
                GenericName = m.GenericName,
                Manufacturer = m.Manufacturer,
                Category = m.Category,
                Description = m.Description,
                Price = m.Price,
                StockQuantity = m.StockQuantity,
                RequiresPrescription = m.RequiresPrescription,
                DosageForm = m.DosageForm,
                Strength = m.Strength,
                ExpiryDate = m.ExpiryDate,
                IsActive = m.IsActive,
                PharmacyId = m.PharmacyId,
                PharmacyName = m.Pharmacy.Name
            })
            .ToListAsync();

        return Ok(new PagedResult<MedicineDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = search.Page,
            PageSize = search.PageSize
        });
    }

    // ── Public: GET single medicine ───────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var m = await _db.Medicines.Include(x => x.Pharmacy).FirstOrDefaultAsync(x => x.Id == id);
        if (m is null) return NotFound();

        return Ok(new MedicineDto
        {
            Id = m.Id,
            Name = m.Name,
            GenericName = m.GenericName,
            Manufacturer = m.Manufacturer,
            Category = m.Category,
            Description = m.Description,
            Price = m.Price,
            StockQuantity = m.StockQuantity,
            RequiresPrescription = m.RequiresPrescription,
            DosageForm = m.DosageForm,
            Strength = m.Strength,
            ExpiryDate = m.ExpiryDate,
            IsActive = m.IsActive,
            PharmacyId = m.PharmacyId,
            PharmacyName = m.Pharmacy.Name
        });
    }

    // ── Pharmacist: Get medicines for own pharmacy ────────────────────────
    [Authorize(Roles = "Pharmacist")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var pharmacy = await _db.Pharmacies.FirstOrDefaultAsync(p => p.OwnerId == CurrentUserId);
        if (pharmacy is null)
            return NotFound(new { message = "No pharmacy found for your account." });

        var medicines = await _db.Medicines
            .Where(m => m.PharmacyId == pharmacy.Id)
            .Select(m => new MedicineDto
            {
                Id = m.Id,
                Name = m.Name,
                GenericName = m.GenericName,
                Manufacturer = m.Manufacturer,
                Category = m.Category,
                Description = m.Description,
                Price = m.Price,
                StockQuantity = m.StockQuantity,
                RequiresPrescription = m.RequiresPrescription,
                DosageForm = m.DosageForm,
                Strength = m.Strength,
                ExpiryDate = m.ExpiryDate,
                IsActive = m.IsActive,
                PharmacyId = m.PharmacyId,
                PharmacyName = pharmacy.Name
            })
            .ToListAsync();

        return Ok(medicines);
    }

    // ── Pharmacist: Add medicine ──────────────────────────────────────────
    [Authorize(Roles = "Pharmacist")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMedicineDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var pharmacy = await _db.Pharmacies
            .FirstOrDefaultAsync(p => p.OwnerId == CurrentUserId && p.Status == RegistrationStatus.Approved);

        if (pharmacy is null)
            return BadRequest(new { message = "You need an approved pharmacy to add medicines." });

        var medicine = new Medicine
        {
            Name = dto.Name,
            GenericName = dto.GenericName,
            Manufacturer = dto.Manufacturer,
            Category = dto.Category,
            Description = dto.Description,
            Price = dto.Price,
            StockQuantity = dto.StockQuantity,
            RequiresPrescription = dto.RequiresPrescription,
            DosageForm = dto.DosageForm,
            Strength = dto.Strength,
            ExpiryDate = dto.ExpiryDate,
            PharmacyId = pharmacy.Id
        };

        _db.Medicines.Add(medicine);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { medicine.Id });
    }

    // ── Pharmacist / Admin: Update medicine ───────────────────────────────
    [Authorize(Roles = "Pharmacist,Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMedicineDto dto)
    {
        var medicine = await _db.Medicines.Include(m => m.Pharmacy).FirstOrDefaultAsync(m => m.Id == id);
        if (medicine is null) return NotFound();

        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role != "Admin" && medicine.Pharmacy.OwnerId != CurrentUserId)
            return Forbid();

        if (dto.Name is not null) medicine.Name = dto.Name;
        if (dto.GenericName is not null) medicine.GenericName = dto.GenericName;
        if (dto.Manufacturer is not null) medicine.Manufacturer = dto.Manufacturer;
        if (dto.Category is not null) medicine.Category = dto.Category;
        if (dto.Description is not null) medicine.Description = dto.Description;
        if (dto.Price.HasValue) medicine.Price = dto.Price.Value;
        if (dto.StockQuantity.HasValue) medicine.StockQuantity = dto.StockQuantity.Value;
        if (dto.RequiresPrescription.HasValue) medicine.RequiresPrescription = dto.RequiresPrescription.Value;
        if (dto.DosageForm is not null) medicine.DosageForm = dto.DosageForm;
        if (dto.Strength is not null) medicine.Strength = dto.Strength;
        if (dto.ExpiryDate.HasValue) medicine.ExpiryDate = dto.ExpiryDate.Value;
        medicine.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Pharmacist / Admin: Soft-delete medicine ──────────────────────────
    [Authorize(Roles = "Pharmacist,Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var medicine = await _db.Medicines.Include(m => m.Pharmacy).FirstOrDefaultAsync(m => m.Id == id);
        if (medicine is null) return NotFound();

        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role != "Admin" && medicine.Pharmacy.OwnerId != CurrentUserId)
            return Forbid();

        medicine.IsActive = false;
        medicine.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
