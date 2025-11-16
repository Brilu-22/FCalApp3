// MyFitnessBackend/Models/Models.cs
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyFitnessBackend.Models
{
    // === CORE MODELS ===
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