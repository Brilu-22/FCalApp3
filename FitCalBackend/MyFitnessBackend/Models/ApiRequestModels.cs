using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyFitnessBackend.Models
{
    // Request model for the Gemini AI plan generation
    public class GenerateAiPlanRequest
    {
        // Optional: for any additional specific instructions the user might want to add
        public string? Prompt { get; set; }
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; } = 5; // Default to 5 days, user can override
    }

    // Request model for Edamam nutrition analysis
    public class AnalyzeNutritionRequest
    {
        public required List<string> Ingredients { get; set; }
    }

    // --- Gemini API Response Models (simplified for extracting text) ---
    // These models are used internally by your backend to parse Gemini's response.
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

    // Note: Edamam's response structure is complex and returned as raw JSON.
    // No specific C# model is defined for it here beyond basic request.
}