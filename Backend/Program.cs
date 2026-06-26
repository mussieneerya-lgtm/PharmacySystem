using System.Text;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ── Database ────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Authentication ──────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ── Application Services ────────────────────────────────────────────────────
builder.Services.AddScoped<ITokenService, TokenService>();

// ── Controllers ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ── CORS ─────────────────────────────────────────────────────────────────────
var corsOrigins = builder.Configuration["CorsOrigins"] ?? "http://localhost:4200";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(corsOrigins.Split(','))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ── Swagger / OpenAPI ────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Pharmacy System API",
        Version = "v1",
        Description = "API for managing pharmacies, medicines, and prescriptions"
    });

    // Add JWT auth to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token. Example: Bearer eyJhbGci..."
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Seed: ensure a working Admin account exists on every cold start ───────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();

    const string superAdminEmail    = "superadmin@pharmacy.com";
    const string superAdminPassword = "admin123";

    var existing = db.Users.FirstOrDefault(u => u.Email == superAdminEmail);

    if (existing is null)
    {
        // Fresh database — insert the admin account
        db.Users.Add(new Backend.Models.User
        {
            Email        = superAdminEmail,
            FullName     = "Super Admin",
            Role         = "Admin",
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(superAdminPassword)
        });
        db.SaveChanges();
    }
    else
    {
        // Account already exists — only fix role/active state, never re-hash
        bool dirty = false;

        if (existing.Role != "Admin")   { existing.Role     = "Admin"; dirty = true; }
        if (!existing.IsActive)         { existing.IsActive = true;    dirty = true; }

        if (dirty) db.SaveChanges();
    }
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pharmacy System API v1");
        c.RoutePrefix = "swagger";
    });
}

// NOTE: UseHttpsRedirection is intentionally omitted for the local HTTP dev
// profile (http://localhost:5211). Enabling it while running on plain HTTP
// causes the server to issue a 307 redirect that browsers refuse to follow
// across origins, producing a "failed to fetch" error in Angular.
app.UseStaticFiles();          // serves wwwroot/uploads/logos/* — must be before UseCors
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
