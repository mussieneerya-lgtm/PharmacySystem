using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PharmacyController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PharmacyController(ApplicationDbContext db) => _db = db;

    private int CurrentUserId =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
               ?? "0");

    // ── Public: GET all approved pharmacies ───────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? city, [FromQuery] string? name)
    {
        var query = _db.Pharmacies
            .Include(p => p.Owner)
            .Where(p => p.Status == RegistrationStatus.Approved)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(p => p.City.Contains(city));

        if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(p => p.Name.Contains(name));

        var result = await query
            .Select(p => new PharmacyDto
            {
                Id = p.Id,
                Name = p.Name,
                LicenseNumber = p.LicenseNumber,
                Address = p.Address,
                City = p.City,
                Phone = p.Phone,
                Email = p.Email,
                Status = p.Status.ToString(),
                RegisteredAt = p.RegisteredAt,
                ApprovedAt = p.ApprovedAt,
                OwnerId = p.OwnerId,
                OwnerName = p.Owner.FullName
            })
            .ToListAsync();

        return Ok(result);
    }

    // ── Public: GET single pharmacy ───────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Pharmacies.Include(x => x.Owner).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();

        return Ok(new PharmacyDto
        {
            Id = p.Id,
            Name = p.Name,
            LicenseNumber = p.LicenseNumber,
            Address = p.Address,
            City = p.City,
            Phone = p.Phone,
            Email = p.Email,
            Status = p.Status.ToString(),
            RegisteredAt = p.RegisteredAt,
            ApprovedAt = p.ApprovedAt,
            OwnerId = p.OwnerId,
            OwnerName = p.Owner.FullName
        });
    }

    // ── Admin: GET all pharmacies (any status) ────────────────────────────
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<IActionResult> GetAllAdmin()
    {
        var list = await _db.Pharmacies
            .Include(p => p.Owner)
            .Select(p => new PharmacyDto
            {
                Id = p.Id,
                Name = p.Name,
                LicenseNumber = p.LicenseNumber,
                Address = p.Address,
                City = p.City,
                Phone = p.Phone,
                Email = p.Email,
                Status = p.Status.ToString(),
                RegisteredAt = p.RegisteredAt,
                ApprovedAt = p.ApprovedAt,
                OwnerId = p.OwnerId,
                OwnerName = p.Owner.FullName
            })
            .ToListAsync();

        return Ok(list);
    }

    // ── Pharmacist: Register a new pharmacy ───────────────────────────────
    [Authorize(Roles = "Pharmacist")]
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] CreatePharmacyDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (await _db.Pharmacies.AnyAsync(p => p.OwnerId == CurrentUserId))
            return Conflict(new { message = "You already have a registered pharmacy." });

        if (await _db.Pharmacies.AnyAsync(p => p.LicenseNumber == dto.LicenseNumber))
            return Conflict(new { message = "License number already in use." });

        var pharmacy = new Pharmacy
        {
            Name = dto.Name,
            LicenseNumber = dto.LicenseNumber,
            Address = dto.Address,
            City = dto.City,
            Phone = dto.Phone,
            Email = dto.Email,
            OwnerId = CurrentUserId,
            Status = RegistrationStatus.Pending
        };

        _db.Pharmacies.Add(pharmacy);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { pharmacy.Id, message = "Registration submitted. Awaiting admin approval." });
    }

    // ── Pharmacist / Admin: Update pharmacy details ───────────────────────
    [Authorize(Roles = "Pharmacist,Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePharmacyDto dto)
    {
        var pharmacy = await _db.Pharmacies.FindAsync(id);
        if (pharmacy is null) return NotFound();

        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role != "Admin" && pharmacy.OwnerId != CurrentUserId)
            return Forbid();

        if (dto.Name is not null) pharmacy.Name = dto.Name;
        if (dto.Address is not null) pharmacy.Address = dto.Address;
        if (dto.City is not null) pharmacy.City = dto.City;
        if (dto.Phone is not null) pharmacy.Phone = dto.Phone;
        if (dto.Email is not null) pharmacy.Email = dto.Email;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Admin: Approve / Reject pharmacy ─────────────────────────────────
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ApprovePharmacyDto dto)
    {
        var pharmacy = await _db.Pharmacies.FindAsync(id);
        if (pharmacy is null) return NotFound();

        pharmacy.Status = dto.Status;
        if (dto.Status == RegistrationStatus.Approved)
            pharmacy.ApprovedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { pharmacy.Id, Status = pharmacy.Status.ToString() });
    }

    // ── Admin: Delete pharmacy ────────────────────────────────────────────
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var pharmacy = await _db.Pharmacies.FindAsync(id);
        if (pharmacy is null) return NotFound();

        _db.Pharmacies.Remove(pharmacy);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Pharmacist: My pharmacy ───────────────────────────────────────────
    [Authorize(Roles = "Pharmacist")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var p = await _db.Pharmacies
            .Include(x => x.Owner)
            .FirstOrDefaultAsync(x => x.OwnerId == CurrentUserId);

        if (p is null) return NotFound(new { message = "You have no registered pharmacy." });

        return Ok(new PharmacyDto
        {
            Id = p.Id,
            Name = p.Name,
            LicenseNumber = p.LicenseNumber,
            Address = p.Address,
            City = p.City,
            Phone = p.Phone,
            Email = p.Email,
            Status = p.Status.ToString(),
            RegisteredAt = p.RegisteredAt,
            ApprovedAt = p.ApprovedAt,
            OwnerId = p.OwnerId,
            OwnerName = p.Owner.FullName
        });
    }
}
