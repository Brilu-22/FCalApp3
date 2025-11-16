// MyFitnessBackend/Models.cs
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyFitnessBackend.Models
{
    // Request model for the Gemini AI plan generation
    public class GenerateAiPlanRequest
    {
        public string? Prompt { get; set; }
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; } = 5;
    }

    // Request model for Edamam nutrition analysis
    public class AnalyzeNutritionRequest
    {
        public required List<string> Ingredients { get; set; }
    }

    // --- Gemini API Response Models ---
    public class GeminiResponsePart
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    public class GeminiResponseContent
    {
        [JsonPropertyName("parts")]
        public List<GeminiResponsePart>? Parts { get; set; }
    }

    public class GeminiResponseCandidate
    {
        [JsonPropertyName("content")]
        public GeminiResponseContent? Content { get; set; }
    }

    public class GeminiApiResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiResponseCandidate>? Candidates { get; set; }
    }

    // --- NEW: Data Models for User Plans and Dashboard ---

    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<GeneratedPlan> Plans { get; set; } = new();
    }

    public class GeneratedPlan
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        // User inputs
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; }

        // Generated content
        public string WorkoutPlan { get; set; } = string.Empty;
        public string MealPlan { get; set; } = string.Empty;

        // Progress tracking
        public double WeightProgress { get; set; }
        public int CompletedWorkouts { get; set; }
        public int TotalWorkouts { get; set; }
    }

    public class DashboardData
    {
        public string UserId { get; set; } = string.Empty;
        public GeneratedPlan? CurrentPlan { get; set; }
        public double WeightProgressPercentage { get; set; }
        public double WorkoutCompletionRate { get; set; }
        public List<WeightEntry> WeightHistory { get; set; } = new();
        public List<WorkoutCompletion> WeeklyProgress { get; set; } = new();
    }

    public class WeightEntry
    {
        public DateTime Date { get; set; }
        public double Weight { get; set; }
    }

    public class WorkoutCompletion
    {
        public DateTime Date { get; set; }
        public bool Completed { get; set; }
        public string WorkoutType { get; set; } = string.Empty;
    }
}