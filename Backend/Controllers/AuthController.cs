using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;

    public AuthController(ApplicationDbContext db, ITokenService tokenService, IConfiguration config)
    {
        _db = db;
        _tokenService = tokenService;
        _config = config;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var allowed = new[] { "Admin", "Pharmacist", "Customer" };
        if (!allowed.Contains(dto.Role))
            return BadRequest(new { message = "Invalid role. Allowed: Admin, Pharmacist, Customer" });

        // Only existing admins can create another Admin account
        if (dto.Role == "Admin")
        {
            var callerRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (callerRole != "Admin")
                return Forbid();
        }

        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "Email already registered." });

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user);
        var hours = int.Parse(_config["JwtSettings:ExpirationHours"] ?? "8");

        return CreatedAtAction(nameof(GetMe), null, new AuthResponseDto
        {
            Token = token,
            Role = user.Role,
            FullName = user.FullName,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(hours)
        });
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is deactivated." });

        var token = _tokenService.GenerateToken(user);
        var hours = int.Parse(_config["JwtSettings:ExpirationHours"] ?? "8");

        return Ok(new AuthResponseDto
        {
            Token = token,
            Role = user.Role,
            FullName = user.FullName,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(hours)
        });
    }

    // GET api/auth/me
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                       ?? throw new InvalidOperationException("No user id claim");
        var userId = int.Parse(userIdClaim);

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        return Ok(new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    // GET api/auth/users  (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    // PATCH api/auth/users/{id}/toggle-active  (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPatch("users/{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();

        return Ok(new { user.Id, user.IsActive });
    }
}
