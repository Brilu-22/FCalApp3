using Microsoft.AspNetCore.Mvc;
using MyFitnessBackend.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization; // For JsonIgnoreCondition
using Microsoft.Extensions.Configuration; // For IConfiguration

namespace MyFitnessBackend.Controllers
{
    [ApiController]
    [Route("api")]
    public class ApiController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly string? _geminiApiKey;
        private readonly string? _edamamAppId;
        private readonly string? _edamamAppKey;
        private readonly string? _gcpProjectId; // Stored, but not directly used in the current Gemini URL

        public ApiController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;

            // Load API keys and Project ID from appsettings.json
            _geminiApiKey = _configuration["ApiKeys:Gemini"];
            _edamamAppId = _configuration["ApiKeys:EdamamAppId"];
            _edamamAppKey = _configuration["ApiKeys:EdamamAppKey"];
            _gcpProjectId = _configuration["GCPProjectID"];

            // Console warning if any keys are missing
            if (string.IsNullOrEmpty(_geminiApiKey))
            {
                Console.WriteLine("WARNING: Gemini API key is missing in configuration.");
            }
            if (string.IsNullOrEmpty(_edamamAppId) || string.IsNullOrEmpty(_edamamAppKey))
            {
                Console.WriteLine("WARNING: Edamam API keys are missing in configuration.");
            }
            if (string.IsNullOrEmpty(_gcpProjectId))
            {
                Console.WriteLine("WARNING: GCP Project ID is missing in configuration.");
            }
        }

        // --- Gemini Proxy Endpoint ---
        [HttpPost("generate_ai_plan")]
        public async Task<IActionResult> GenerateAiPlan([FromBody] GenerateAiPlanRequest request)
        {
            // Basic validation for required input fields
            if (request.CurrentWeightKg <= 0 || request.TargetWeightKg <= 0 || request.WorkoutDurationMinutes <= 0 || request.DaysPerWeek <= 0)
            {
                return BadRequest("Current Weight, Target Weight, Workout Duration, and Days Per Week are required and must be positive values.");
            }
            if (string.IsNullOrEmpty(_geminiApiKey))
            {
                return StatusCode(503, "Gemini API key is not configured on the backend.");
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                // --- SETTING HTTP CLIENT TIMEOUT HERE ---
                httpClient.Timeout = TimeSpan.FromMinutes(5); // Set a 5-minute timeout for the Gemini API call
                // ----------------------------------------

                // This is the working endpoint for gemini-2.5-pro on the Generative Language API
                var geminiApiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={_geminiApiKey}";

                // Construct a detailed prompt for Gemini
                string geminiPrompt = $@"As an AI fitness and nutrition coach, generate a comprehensive {request.DaysPerWeek}-day plan for a user.

**User Details:**
- Current Weight: {request.CurrentWeightKg} kg
- Target Weight: {request.TargetWeightKg} kg
- Desired Workout Duration per session: {request.WorkoutDurationMinutes} minutes

**Workout Plan Requirements ({request.DaysPerWeek} days a week):**
- Create a workout schedule for {request.DaysPerWeek} days.
- Each workout session should be approximately {request.WorkoutDurationMinutes} minutes.
- Include exercises for the following muscle groups: shoulders, legs, back, chest, core, and arms.
- For each exercise, suggest specific exercises, sets, and reps.
- Vary the exercises throughout the week to target different areas effectively.

**Meal Plan Requirements (for target weight):**
- Create a daily meal plan for {request.DaysPerWeek} days, aligning with the target weight goals.
- Each day should include: Breakfast, Lunch, Dinner, and two snacks (mid-morning and afternoon).
- Provide simple, healthy meal suggestions with common ingredients.
- Focus on balanced nutrition to support the target weight goal (e.g., if target is lower, suggest calorie-conscious meals; if higher, balanced with adequate protein).
- Do NOT provide calorie counts or detailed nutritional breakdowns (this backend can call Edamam for that if you implement it later). Just meal suggestions.

Please present the plan clearly, separated into a 'Workout Plan' and a 'Meal Plan' section for each day.
";

                // Append any optional user prompt for customization
                if (!string.IsNullOrEmpty(request.Prompt))
                {
                    geminiPrompt += $"\n\n**Additional user request:** {request.Prompt}";
                }

                var geminiRequestPayload = new
                {
                    contents = new[] { new { parts = new[] { new { text = geminiPrompt } } } }
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(geminiRequestPayload, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull }),
                    Encoding.UTF8,
                    "application/json"
                );

                var geminiResponse = await httpClient.PostAsync(geminiApiUrl, content);
                var responseBody = await geminiResponse.Content.ReadAsStringAsync(); // Always read response body for logging

                if (!geminiResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Gemini API error status: {geminiResponse.StatusCode}, response: {responseBody}");
                    return StatusCode((int)geminiResponse.StatusCode, $"Gemini API returned an error: {responseBody}");
                }

                GeminiApiResponse? geminiApiResponse = null;
                try
                {
                    geminiApiResponse = JsonSerializer.Deserialize<GeminiApiResponse>(responseBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"JSON Deserialization error from successful Gemini response: {ex.Message}. Response Body: {responseBody}");
                    return StatusCode(500, $"Failed to parse successful Gemini API response: {ex.Message}");
                }

                var aiTextResponse = geminiApiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

                if (string.IsNullOrEmpty(aiTextResponse))
                {
                    Console.WriteLine($"Gemini API returned success, but no text was extracted. Response Body: {responseBody}");
                    return StatusCode(500, "Could not extract AI response text from Gemini. Response might be empty or malformed.");
                }

                return Ok(new { aiResponse = aiTextResponse });
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"Gemini API HTTP error: {ex.Message}");
                return StatusCode(502, $"Error calling Gemini API: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An unexpected error occurred in GenerateAiPlan: {ex.Message}");
                return StatusCode(500, $"An unexpected error occurred: {ex.Message}");
            }
        }

        // --- Edamam Proxy Endpoint ---
        [HttpPost("analyze_nutrition")]
        public async Task<IActionResult> AnalyzeNutrition([FromBody] AnalyzeNutritionRequest request)
        {
            if (request.Ingredients == null || !request.Ingredients.Any())
            {
                return BadRequest("An array of ingredients is required.");
            }
            if (string.IsNullOrEmpty(_edamamAppId) || string.IsNullOrEmpty(_edamamAppKey))
            {
                return StatusCode(503, "Edamam API keys are not configured on the backend.");
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                // Edamam Nutrition Analysis API endpoint
                var edamamApiUrl = $"https://api.edamam.com/api/nutrition-details?app_id={_edamamAppId}&app_key={_edamamAppKey}";

                // --- THIS IS THE CHANGE ---
                var edamamRequestPayload = new { ingr = request.Ingredients }; // Change 'ingredients' to 'ingr'
                // --------------------------

                var content = new StringContent(
                    JsonSerializer.Serialize(edamamRequestPayload),
                    Encoding.UTF8,
                    "application/json"
                );

                var edamamResponse = await httpClient.PostAsync(edamamApiUrl, content);
                var responseBody = await edamamResponse.Content.ReadAsStringAsync(); // Always read response body for logging

                if (!edamamResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Edamam API error status: {edamamResponse.StatusCode}, response: {responseBody}");
                    return StatusCode((int)edamamResponse.StatusCode, $"Edamam API returned an error: {responseBody}");
                }

                return Ok(JsonDocument.Parse(responseBody)); // Return Edamam's raw JSON response
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"Edamam API HTTP error: {ex.Message}");
                return StatusCode(502, $"Error calling Edamam API: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An unexpected error occurred in AnalyzeNutrition: {ex.Message}");
                return StatusCode(500, $"An unexpected error occurred: {ex.Message}");
            }
        }
    }
}