using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

/// <summary>Returned by GET /api/profile and PUT /api/profile.</summary>
public class ProfileDto
{
    public int Id { get; set; }
    public string FullName  { get; set; } = string.Empty;
    public string Email     { get; set; } = string.Empty;
    public string Phone     { get; set; } = string.Empty;
    public string Role      { get; set; } = string.Empty;
    public string LogoUrl   { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>Text fields for PUT /api/profile (multipart/form-data).</summary>
public class UpdateProfileDto
{
    [Required, MinLength(2), MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;
}
