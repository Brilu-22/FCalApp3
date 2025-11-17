// MyFitnessBackend/Models/Models.cs
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization; // Required for [JsonPropertyName]

namespace MyFitnessBackend.Models
{
    // === CORE APP MODELS ===

    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // Plans can be linked via UserId in the GeneratedPlan model
        // public List<GeneratedPlan> Plans { get; set; } = new(); // This might be redundant if plans are fetched by UserId
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

        // These will store the *full* text response from Gemini for workouts and meals
        public string WorkoutPlan { get; set; } = string.Empty;
        public string MealPlan { get; set; } = string.Empty;

        // Progress tracking
        public double WeightProgress { get; set; } // Represents cumulative weight change towards target
        public int CompletedWorkouts { get; set; }
        public int TotalWorkouts { get; set; } // Should equal DaysPerWeek from the plan
    }

    public class DashboardData
    {
        public string UserId { get; set; } = string.Empty;
        public GeneratedPlan? CurrentPlan { get; set; } // The active plan for this user
        public double WeightProgressPercentage { get; set; }
        public double WorkoutCompletionRate { get; set; }
        public List<WeightEntry> WeightHistory { get; set; } = new(); // History of recorded weights
        public List<WorkoutCompletion> WeeklyProgress { get; set; } = new(); // Weekly workout completion status
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
        public string WorkoutType { get; set; } = string.Empty; // e.g., "Strength", "Cardio"
    }

    // === API REQUEST MODELS ===

    public class GenerateAiPlanRequest
    {
        // This 'Prompt' property exists in your original code but is not used to build the Gemini prompt.
        // The prompt is constructed directly in the controller using other request parameters.
        // It's kept here for consistency with your original definition.
        public string? Prompt { get; set; }
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; } = 5; // Default value, but client can override
        public required string FitnessLevel { get; set; } // e.g., "beginner", "intermediate"
        public required string DietaryPreference { get; set; } // e.g., "balanced", "vegetarian"
    }

    public class SavePlanRequest
    {
        // This request expects a complete GeneratedPlan object from the client
        public required GeneratedPlan Plan { get; set; }
    }

    public class ProgressUpdateRequest
    {
        public double? CurrentWeight { get; set; } // Optional: update current weight
        public int? CompletedWorkouts { get; set; } // Optional: update workout count
        public List<WorkoutCompletion>? WeeklyProgress { get; set; } // Optional: update weekly workout status
    }

    public class WorkoutCompletionRequest
    {
        public string? WorkoutType { get; set; } // Optional: type of workout completed
    }

    // === GEMINI API RESPONSE MODELS ===
    // These models accurately reflect the typical structure of a Gemini API 'generateContent' response.
    // They are essential for correctly deserializing the JSON received from the AI.

    public class GeminiResponsePart
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    public class GeminiResponseContent
    {
        [JsonPropertyName("parts")]
        public List<GeminiResponsePart>? Parts { get; set; }

        [JsonPropertyName("role")]
        public string? Role { get; set; } // e.g., "model", "user"
    }

    public class GeminiResponseCandidate
    {
        [JsonPropertyName("content")]
        public GeminiResponseContent? Content { get; set; }

        [JsonPropertyName("finishReason")]
        public string? FinishReason { get; set; } // e.g., "STOP", "MAX_TOKENS", "SAFETY"

        // You might also find 'safetyRatings' or 'citationMetadata' here, depending on API version and request
        // [JsonPropertyName("safetyRatings")]
        // public List<SafetyRating>? SafetyRatings { get; set; }
    }

    public class GeminiUsageMetadata
    {
        [JsonPropertyName("promptTokenCount")]
        public int PromptTokenCount { get; set; }

        [JsonPropertyName("candidatesTokenCount")]
        public int CandidatesTokenCount { get; set; }

        [JsonPropertyName("totalTokenCount")]
        public int TotalTokenCount { get; set; }
    }

    public class GeminiApiResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiResponseCandidate>? Candidates { get; set; }

        [JsonPropertyName("usageMetadata")]
        public GeminiUsageMetadata? UsageMetadata { get; set; }

        // Sometimes the API might return a 'promptFeedback' if there were issues with the prompt
        // [JsonPropertyName("promptFeedback")]
        // public PromptFeedback? PromptFeedback { get; set; }
    }
}