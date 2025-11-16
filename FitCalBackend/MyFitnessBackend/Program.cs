// MyFitnessBackend/Program.cs
using MyFitnessBackend.Models;
using Microsoft.Extensions.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// Add CORS policy - FIXED VERSION
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactNative", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",    // Expo web (this is missing!)
                "http://localhost:8081",    // Expo web alternative
                "http://localhost:19006",   // Expo dev client
                "http://10.0.2.2:5089",     // Android emulator
                "http://192.168.1.100:5089" // Your local IP
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Add this for cookies/auth if needed
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// MIDDLEWARE ORDER IS IMPORTANT!
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowReactNative"); // Use the specific policy name
app.UseAuthorization();
app.MapControllers();

app.Run();