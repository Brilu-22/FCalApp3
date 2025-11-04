// MyFitnessBackend/Program.cs
using MyFitnessBackend.Models;
using Microsoft.Extensions.Configuration; // To access API keys

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient(); // Registers HttpClientFactory


// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactNative", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8081", // Expo web
                "http://localhost:19006", // Expo dev client
                "http://10.0.2.2:5089",   // Android emulator
                "http://192.168.1.100:5089" // Your local IP
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Use CORS
app.UseCors("AllowReactNative");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting(); // Important: Must be before UseCors and UseAuthorization
app.UseCors(); // Apply the CORS policy
app.UseAuthorization();
app.MapControllers();

app.Run();