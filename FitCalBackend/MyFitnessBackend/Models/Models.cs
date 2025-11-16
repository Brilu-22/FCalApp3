using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyFitnessBackend.Models
{
    // === CORE REQUEST MODELS ===
    public class GenerateAiPlanRequestDto
    {
        public string? Prompt { get; set; }
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; } = 5;
    }

    public class AnalyzeNutritionRequestDto
    {
        public required List<string> Ingredients { get; set; }
    }

    // === GEMINI RESPONSE MODELS ===
    public class GeminiResponsePartDto
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    public class GeminiResponseCandidateDto
    {
        [JsonPropertyName("content")]
        public GeminiResponseContent? Content { get; set; }
    }

    public class GeminiApiResponseDto
    {
        [JsonPropertyName("candidates")]
        public List<GeminiResponseCandidateDto>? Candidates { get; set; }
    }

    // === USER AND PLAN MODELS ===
    public class UserDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<GeneratedPlanDto> Plans { get; set; } = new();
    }

    public class GeneratedPlanDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; }
        public string WorkoutPlan { get; set; } = string.Empty;
        public string MealPlan { get; set; } = string.Empty;
        public double WeightProgress { get; set; }
        public int CompletedWorkouts { get; set; }
        public int TotalWorkouts { get; set; }
    }

    public class DashboardDataDto
    {
        public string UserId { get; set; } = string.Empty;
        public GeneratedPlanDto? CurrentPlan { get; set; }
        public double WeightProgressPercentage { get; set; }
        public double WorkoutCompletionRate { get; set; }
        public List<WeightRecord> WeightHistory { get; set; } = new();
        public List<WorkoutCompletion> WeeklyProgress { get; set; } = new();
    }

    public class WeightRecord
    {
        public DateTime Date { get; set; }
        public double Weight { get; set; }
    }

    // === NEW REQUEST MODELS ===
    public class SavePlanRequest
    {
        public required GeneratedPlanDto Plan { get; set; }
    }

    public class ProgressUpdateRequest
    {
        public double? CurrentWeight { get; set; }
        public int? CompletedWorkouts { get; set; }
        public List<WorkoutCompletion>? WeeklyProgress { get; set; }
    }

    public class WorkoutCompletionRequest
    {
        public string? WorkoutType { get; set; }
    }
}