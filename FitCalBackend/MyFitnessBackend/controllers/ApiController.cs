using Microsoft.AspNetCore.Mvc;
using MyFitnessBackend.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace MyFitnessBackend.Controllers
{
    [ApiController]
    [Route("api")]
    public class ApiController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly string? _geminiApiKey;

        // In-memory storage for demo purposes - replace with database in production
        private static readonly List<GeneratedPlan> _generatedPlans = new();
        private static readonly List<User> _users = new();
        private static readonly List<DashboardData> _dashboardData = new();

        public ApiController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;

            // Load API keys from appsettings.json
            _geminiApiKey = _configuration["ApiKeys:Gemini"];

            // Console warning if key is missing
            if (string.IsNullOrEmpty(_geminiApiKey))
            {
                Console.WriteLine("WARNING: Gemini API key is missing in configuration.");
            }
        }

        // --- Enhanced Gemini AI Plan Generation ---
        [HttpPost("generate_ai_plan")]
        public async Task<IActionResult> GenerateAiPlan([FromBody] GenerateAiPlanRequest request)
        {
            // Enhanced validation
            if (request.CurrentWeightKg <= 0 || request.TargetWeightKg <= 0 ||
                request.WorkoutDurationMinutes <= 0 || request.DaysPerWeek <= 0)
            {
                return BadRequest("Current Weight, Target Weight, Workout Duration, and Days Per Week are required and must be positive values.");
            }

            if (string.IsNullOrEmpty(request.FitnessLevel))
            {
                return BadRequest("Fitness level is required.");
            }

            if (string.IsNullOrEmpty(request.DietaryPreference))
            {
                return BadRequest("Dietary preference is required.");
            }

            if (string.IsNullOrEmpty(_geminiApiKey))
            {
                return StatusCode(503, "Gemini API key is not configured on the backend.");
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromMinutes(5);

                var geminiApiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={_geminiApiKey}";

                // Enhanced prompt for both workouts and nutrition
                string geminiPrompt = $@"As an expert AI fitness and nutrition coach, create a comprehensive {request.DaysPerWeek}-day personalized plan.

USER PROFILE:
- Current Weight: {request.CurrentWeightKg} kg
- Target Weight: {request.TargetWeightKg} kg  
- Workout Duration: {request.WorkoutDurationMinutes} minutes per session
- Training Days: {request.DaysPerWeek} days per week
- Fitness Level: {request.FitnessLevel}
- Dietary Preference: {request.DietaryPreference}

WORKOUT PLAN REQUIREMENTS:
- Create {request.DaysPerWeek} distinct workout sessions
- Each session should be approximately {request.WorkoutDurationMinutes} minutes
- Design workouts appropriate for {request.FitnessLevel} fitness level
- Include warm-up and cool-down recommendations
- Vary focus areas: strength training, cardio, flexibility, etc.
- Provide specific exercises with sets, reps, and rest periods
- Ensure progressive overload principles

NUTRITION PLAN REQUIREMENTS:
- Create {request.DaysPerWeek} days of meal plans for {request.DietaryPreference} diet
- Each day should include: Breakfast, Lunch, Dinner, and 2 healthy snacks
- Provide specific meal suggestions with common ingredients
- Focus on supporting weight goal from {request.CurrentWeightKg}kg to {request.TargetWeightKg}kg
- Include portion guidance and preparation tips
- Ensure balanced macronutrients for {request.DietaryPreference} preference

OUTPUT FORMAT:
For each day, use this exact structure:

Day X:
WORKOUT: [Workout type/focus]
[Detailed workout plan with exercises, sets, reps, and instructions]

MEALS: 
Breakfast: [Specific meal description with ingredients]
Lunch: [Specific meal description with ingredients] 
Dinner: [Specific meal description with ingredients]
Snack 1: [Healthy snack suggestion]
Snack 2: [Healthy snack suggestion]

Make the plan practical, motivating, and tailored for a {request.FitnessLevel} level individual. Focus on sustainable habits and clear instructions.";

                var geminiRequestPayload = new
                {
                    contents = new[] { new { parts = new[] { new { text = geminiPrompt } } } },
                    generationConfig = new
                    {
                        temperature = 0.7,
                        topK = 40,
                        topP = 0.95,
                        maxOutputTokens = 2048
                    }
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(geminiRequestPayload, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull }),
                    Encoding.UTF8,
                    "application/json"
                );

                Console.WriteLine($"Sending request to Gemini API for {request.DaysPerWeek}-day plan...");

                var geminiResponse = await httpClient.PostAsync(geminiApiUrl, content);
                var responseBody = await geminiResponse.Content.ReadAsStringAsync();

                if (!geminiResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Gemini API error: {geminiResponse.StatusCode}, response: {responseBody}");
                    return StatusCode((int)geminiResponse.StatusCode, $"AI service error: {geminiResponse.StatusCode}");
                }

                GeminiApiResponse? geminiApiResponse = null;
                try
                {
                    geminiApiResponse = JsonSerializer.Deserialize<GeminiApiResponse>(responseBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"JSON Deserialization error: {ex.Message}");
                    return StatusCode(500, "Failed to parse AI response");
                }

                var aiTextResponse = geminiApiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

                if (string.IsNullOrEmpty(aiTextResponse))
                {
                    Console.WriteLine("Gemini API returned success but no text content");
                    return StatusCode(500, "AI generated empty response");
                }

                Console.WriteLine($"Successfully generated AI plan with {aiTextResponse.Length} characters");

                return Ok(new { aiResponse = aiTextResponse });
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"Gemini API HTTP error: {ex.Message}");
                return StatusCode(502, $"AI service unavailable: {ex.Message}");
            }
            catch (TaskCanceledException ex)
            {
                Console.WriteLine($"Gemini API timeout: {ex.Message}");
                return StatusCode(504, "AI request timeout - please try again");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error in GenerateAiPlan: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // --- User Plan Management Endpoints ---

        [HttpPost("user/{userId}/plans")]
        public async Task<IActionResult> SaveUserPlan(string userId, [FromBody] SavePlanRequest request)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            if (request.Plan == null)
            {
                return BadRequest("Plan data is required.");
            }

            try
            {
                // Create a new generated plan
                var generatedPlan = new GeneratedPlan
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    GeneratedAt = DateTime.UtcNow,
                    CurrentWeightKg = request.Plan.CurrentWeightKg,
                    TargetWeightKg = request.Plan.TargetWeightKg,
                    WorkoutDurationMinutes = request.Plan.WorkoutDurationMinutes,
                    DaysPerWeek = request.Plan.DaysPerWeek,
                    WorkoutPlan = request.Plan.WorkoutPlan,
                    MealPlan = request.Plan.MealPlan,
                    WeightProgress = 0,
                    CompletedWorkouts = 0,
                    TotalWorkouts = request.Plan.DaysPerWeek
                };

                // Remove any existing plans for this user (keep only latest)
                _generatedPlans.RemoveAll(p => p.UserId == userId);
                _generatedPlans.Add(generatedPlan);

                // Create or update dashboard data
                var existingDashboard = _dashboardData.FirstOrDefault(d => d.UserId == userId);
                if (existingDashboard != null)
                {
                    existingDashboard.CurrentPlan = generatedPlan;
                    existingDashboard.WeightProgressPercentage = 0;
                    existingDashboard.WorkoutCompletionRate = 0;
                }
                else
                {
                    var dashboardData = new DashboardData
                    {
                        UserId = userId,
                        CurrentPlan = generatedPlan,
                        WeightProgressPercentage = 0,
                        WorkoutCompletionRate = 0,
                        WeightHistory = new List<WeightEntry>
                        {
                            new WeightEntry { Date = DateTime.UtcNow, Weight = request.Plan.CurrentWeightKg }
                        },
                        WeeklyProgress = GenerateEmptyWeeklyProgress()
                    };
                    _dashboardData.Add(dashboardData);
                }

                Console.WriteLine($"Plan saved for user {userId}. Plan ID: {generatedPlan.Id}");

                return Ok(new
                {
                    message = "Plan saved successfully",
                    planId = generatedPlan.Id,
                    generatedAt = generatedPlan.GeneratedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving plan for user {userId}: {ex.Message}");
                return StatusCode(500, $"Error saving plan: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}/plans")]
        public IActionResult GetUserPlans(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            try
            {
                var userPlans = _generatedPlans
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.GeneratedAt)
                    .ToList();

                if (!userPlans.Any())
                {
                    return NotFound($"No plans found for user {userId}");
                }

                return Ok(userPlans);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving plans for user {userId}: {ex.Message}");
                return StatusCode(500, $"Error retrieving plans: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}/plans/latest")]
        public IActionResult GetLatestUserPlan(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            try
            {
                var latestPlan = _generatedPlans
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.GeneratedAt)
                    .FirstOrDefault();

                if (latestPlan == null)
                {
                    return NotFound($"No plan found for user {userId}");
                }

                return Ok(latestPlan);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving latest plan for user {userId}: {ex.Message}");
                return StatusCode(500, $"Error retrieving latest plan: {ex.Message}");
            }
        }

        // --- Dashboard Endpoints ---

        [HttpGet("user/{userId}/dashboard")]
        public IActionResult GetDashboardData(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            try
            {
                var dashboard = _dashboardData.FirstOrDefault(d => d.UserId == userId);

                if (dashboard == null)
                {
                    // Return empty dashboard if no data exists
                    return Ok(new DashboardData
                    {
                        UserId = userId,
                        CurrentPlan = null,
                        WeightProgressPercentage = 0,
                        WorkoutCompletionRate = 0,
                        WeightHistory = new List<WeightEntry>(),
                        WeeklyProgress = GenerateEmptyWeeklyProgress()
                    });
                }

                // Update progress calculations
                if (dashboard.CurrentPlan != null)
                {
                    var weightDifference = Convert.ToDouble(dashboard.CurrentPlan.CurrentWeightKg) - Convert.ToDouble(dashboard.CurrentPlan.TargetWeightKg);
                    var totalWeightToLose = Math.Abs(weightDifference);
                    var currentProgress = Math.Abs(dashboard.CurrentPlan.WeightProgress);

                    dashboard.WeightProgressPercentage = (int)(totalWeightToLose > 0
                        ? Math.Min(100, (currentProgress / totalWeightToLose) * 100)
                        : 100);

                    dashboard.WorkoutCompletionRate = dashboard.CurrentPlan.TotalWorkouts > 0
                        ? (dashboard.CurrentPlan.CompletedWorkouts / (double)dashboard.CurrentPlan.TotalWorkouts) * 100
                        : 0;
                }

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving dashboard data for user {userId}: {ex.Message}");
                return StatusCode(500, $"Error retrieving dashboard data: {ex.Message}");
            }
        }

        [HttpPost("user/{userId}/progress")]
        public IActionResult UpdateUserProgress(string userId, [FromBody] ProgressUpdateRequest request)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            try
            {
                var dashboard = _dashboardData.FirstOrDefault(d => d.UserId == userId);
                if (dashboard == null || dashboard.CurrentPlan == null)
                {
                    return NotFound($"No active plan found for user {userId}");
                }

                // Update weight progress
                if (request.CurrentWeight.HasValue && request.CurrentWeight > 0)
                {
                    var currentPlan = dashboard.CurrentPlan;
                    var weightChange = currentPlan.CurrentWeightKg - request.CurrentWeight.Value;
                    currentPlan.WeightProgress += weightChange;
                    currentPlan.CurrentWeightKg = request.CurrentWeight.Value;

                    // Add to weight history
                    dashboard.WeightHistory.Add(new WeightEntry
                    {
                        Date = DateTime.UtcNow,
                        Weight = request.CurrentWeight.Value
                    });

                    // Keep only last 10 entries
                    if (dashboard.WeightHistory.Count > 10)
                    {
                        dashboard.WeightHistory = dashboard.WeightHistory
                            .OrderByDescending(w => w.Date)
                            .Take(10)
                            .ToList();
                    }
                }

                // Update workout completion
                if (request.CompletedWorkouts.HasValue)
                {
                    dashboard.CurrentPlan.CompletedWorkouts = Math.Min(
                        request.CompletedWorkouts.Value,
                        dashboard.CurrentPlan.TotalWorkouts
                    );
                }

                // Update weekly progress
                if (request.WeeklyProgress != null && request.WeeklyProgress.Any())
                {
                    dashboard.WeeklyProgress = request.WeeklyProgress;
                }

                return Ok(new { message = "Progress updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating progress for user {userId}: {ex.Message}");
                return StatusCode(500, $"Error updating progress: {ex.Message}");
            }
        }

        [HttpPost("user/{userId}/workout-complete")]
        public IActionResult MarkWorkoutComplete(string userId, [FromBody] WorkoutCompletionRequest request)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            try
            {
                var dashboard = _dashboardData.FirstOrDefault(d => d.UserId == userId);
                if (dashboard == null || dashboard.CurrentPlan == null)
                {
                    return NotFound($"No active plan found for user {userId}");
                }

                // Increment completed workouts (but don't exceed total)
                dashboard.CurrentPlan.CompletedWorkouts = Math.Min(
                    dashboard.CurrentPlan.CompletedWorkouts + 1,
                    dashboard.CurrentPlan.TotalWorkouts
                );

                // Update weekly progress
                var today = DateTime.UtcNow.Date;
                var weeklyEntry = dashboard.WeeklyProgress.FirstOrDefault(w =>
                    w.Date.Date == today);

                if (weeklyEntry != null)
                {
                    weeklyEntry.Completed = true;
                }
                else
                {
                    // Add new entry for today
                    dashboard.WeeklyProgress.Add(new WorkoutCompletion
                    {
                        Date = today,
                        Completed = true,
                        WorkoutType = request.WorkoutType ?? "General Workout"
                    });
                }

                return Ok(new
                {
                    message = "Workout marked as complete",
                    completedWorkouts = dashboard.CurrentPlan.CompletedWorkouts,
                    totalWorkouts = dashboard.CurrentPlan.TotalWorkouts
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error marking workout complete for user {userId}: {ex.Message}");
                return StatusCode(500, $"Error marking workout complete: {ex.Message}");
            }
        }

        // --- Health Check Endpoint ---
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            var healthStatus = new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                geminiConfigured = !string.IsNullOrEmpty(_geminiApiKey),
                totalUsers = _users.Count,
                totalPlans = _generatedPlans.Count,
                totalDashboards = _dashboardData.Count
            };

            return Ok(healthStatus);
        }

        // --- Helper Methods ---

        private List<WorkoutCompletion> GenerateEmptyWeeklyProgress()
        {
            var weekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            var weeklyProgress = new List<WorkoutCompletion>();

            for (int i = 0; i < 7; i++)
            {
                weeklyProgress.Add(new WorkoutCompletion
                {
                    Date = weekStart.AddDays(i),
                    Completed = false,
                    WorkoutType = i % 2 == 0 ? "Strength Training" : "Cardio"
                });
            }

            return weeklyProgress;
        }
    }

    public class WorkoutCompletion
    {
        public DateTime Date { get; internal set; }
        public bool Completed { get; internal set; }
        public string WorkoutType { get; internal set; }
    }

    internal class WeightEntry
    {
        public DateTime Date { get; internal set; }
        public double Weight { get; internal set; }
    }

    internal class DashboardData
    {
        public string UserId { get; internal set; }
        public GeneratedPlan? CurrentPlan { get; internal set; }
        public int WeightProgressPercentage { get; internal set; }
        public double WorkoutCompletionRate { get; internal set; }
        public List<WeightEntry> WeightHistory { get; internal set; }
        public List<WorkoutCompletion> WeeklyProgress { get; internal set; }
    }

    internal class User
    {
    }

    public class GeneratedPlan
    {
        public string Id { get; internal set; }
        public string UserId { get; internal set; }
        public DateTime GeneratedAt { get; internal set; }
        public double CurrentWeightKg { get; internal set; }
        public double TargetWeightKg { get; internal set; }
        public int WorkoutDurationMinutes { get; internal set; }
        public int DaysPerWeek { get; internal set; }
        public string? MealPlan { get; internal set; }
        public string? WorkoutPlan { get; internal set; }
        public double WeightProgress { get; internal set; }
        public int CompletedWorkouts { get; internal set; }
        public int TotalWorkouts { get; internal set; }
    }

    // --- Enhanced Request Models ---

    public class GenerateAiPlanRequest
    {
        public string? Prompt { get; set; }
        public double CurrentWeightKg { get; set; }
        public double TargetWeightKg { get; set; }
        public int WorkoutDurationMinutes { get; set; }
        public int DaysPerWeek { get; set; } = 5;
        public required string FitnessLevel { get; set; }
        public required string DietaryPreference { get; set; }
    }

    public class SavePlanRequest
    {
        public required GeneratedPlan Plan { get; set; }
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

    // --- Gemini Response Models ---
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
}