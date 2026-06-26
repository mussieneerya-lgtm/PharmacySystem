using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSize = 2 * 1024 * 1024; // 2 MB

    public ProfileController(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db  = db;
        _env = env;
    }

    private int CurrentUserId =>
        int.Parse(
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
         ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
         ?? "0");

    // ── GET api/profile ───────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        return Ok(MapToDto(user));
    }

    // ── PUT api/profile ───────────────────────────────────────────────────
    // Accepts multipart/form-data: text fields via [FromForm], logo file optional.
    [HttpPut]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile(
        [FromForm] UpdateProfileDto dto,
        IFormFile? logo)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        // ── Duplicate e-mail guard ────────────────────────────────────────
        if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            var taken = await _db.Users
                .AnyAsync(u => u.Email == dto.Email && u.Id != CurrentUserId);
            if (taken)
                return Conflict(new { message = "That email address is already used by another account." });
        }

        // ── Logo upload ───────────────────────────────────────────────────
        if (logo is not null)
        {
            if (logo.Length == 0)
                return BadRequest(new { message = "Uploaded file is empty." });

            if (logo.Length > MaxFileSize)
                return BadRequest(new { message = "Logo must be 2 MB or smaller." });

            var ext = Path.GetExtension(logo.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(ext))
                return BadRequest(new { message = "Only .jpg, .jpeg, .png, and .webp files are allowed." });

            // Resolve wwwroot — create directory if first upload
            var webRoot     = _env.WebRootPath
                              ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsDir  = Path.Combine(webRoot, "uploads", "logos");
            Directory.CreateDirectory(uploadsDir);

            // Remove previous locally-stored logo
            if (!string.IsNullOrEmpty(user.LogoUrl) && user.LogoUrl.StartsWith("/uploads/"))
            {
                var oldPath = Path.Combine(webRoot, user.LogoUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(oldPath))
                    System.IO.File.Delete(oldPath);
            }

            var fileName = $"user_{CurrentUserId}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await logo.CopyToAsync(stream);

            user.LogoUrl = $"/uploads/logos/{fileName}";
        }

        // ── Persist text fields ───────────────────────────────────────────
        user.FullName = dto.FullName;
        user.Email    = dto.Email;
        user.Phone    = dto.Phone;

        await _db.SaveChangesAsync();

        return Ok(MapToDto(user));
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private static ProfileDto MapToDto(Backend.Models.User user) => new()
    {
        Id        = user.Id,
        FullName  = user.FullName,
        Email     = user.Email,
        Phone     = user.Phone,
        Role      = user.Role,
        LogoUrl   = user.LogoUrl,
        CreatedAt = user.CreatedAt
    };
}
