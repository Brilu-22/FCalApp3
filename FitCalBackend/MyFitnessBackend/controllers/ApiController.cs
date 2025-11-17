using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
public class AIPlanController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public AIPlanController(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _apiKey = configuration["Groq:ApiKey"] ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");

        if (string.IsNullOrEmpty(_apiKey))
        {
            Console.WriteLine("⚠️ Groq API key not configured - using mock responses");
        }
    }

    [HttpPost("generate_ai_plan")]
    public async Task<IActionResult> GenerateAIPlan([FromBody] UserPreferences preferences)
    {
        try
        {
            // If no API key, use mock response instantly
            if (string.IsNullOrEmpty(_apiKey))
            {
                Console.WriteLine("🚀 Using instant mock response");
                var mockPlan = GenerateMockPlan(preferences);
                return Ok(new { aiResponse = mockPlan });
            }

            Console.WriteLine($"🚀 Sending request to Groq for {preferences.DaysPerWeek}-day plan...");

            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = BuildPrompt(preferences)
                    }
                },
                max_tokens = 2048,
                temperature = 0.7
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"✅ Groq API response received");

                var groqResponse = JsonSerializer.Deserialize<GroqResponse>(responseContent);

                if (groqResponse?.choices != null && groqResponse.choices.Length > 0)
                {
                    var aiResponse = groqResponse.choices[0].message?.content;

                    if (!string.IsNullOrEmpty(aiResponse))
                    {
                        Console.WriteLine($"✅ AI plan generated successfully! Length: {aiResponse.Length} characters");
                        return Ok(new { aiResponse });
                    }
                }

                Console.WriteLine("❌ Groq returned success but no content - using mock response");
                return Ok(new { aiResponse = GenerateMockPlan(preferences) });
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"❌ Groq API error: {response.StatusCode} - using mock response");
                // Fallback to mock response
                return Ok(new { aiResponse = GenerateMockPlan(preferences) });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message} - using mock response");
            // Fallback to mock response
            return Ok(new { aiResponse = GenerateMockPlan(preferences) });
        }
    }

    private string BuildPrompt(UserPreferences preferences)
    {
        return $@"
Create a detailed {preferences.DaysPerWeek}-day fitness and nutrition plan.

CURRENT WEIGHT: {preferences.CurrentWeightKg} kg
TARGET WEIGHT: {preferences.TargetWeightKg} kg  
WORKOUT DURATION: {preferences.WorkoutDurationMinutes} minutes per session
DAYS PER WEEK: {preferences.DaysPerWeek}
FITNESS LEVEL: {preferences.FitnessLevel}
DIETARY PREFERENCE: {preferences.DietaryPreference}

Structure each day as:
DAY [Number]:
WORKOUT: [Detailed workout with exercises, sets, reps, and rest periods]
MEALS: [Breakfast, lunch, dinner, and snacks with specific food suggestions]

Make it practical, safe, and achievable for a {preferences.FitnessLevel} level.
Focus on helping achieve the weight goal from {preferences.CurrentWeightKg}kg to {preferences.TargetWeightKg}kg.
";
    }

    private string GenerateMockPlan(UserPreferences preferences)
    {
        var days = new List<string>();

        for (int day = 1; day <= preferences.DaysPerWeek; day++)
        {
            var workout = GetWorkoutForDay(day, preferences.FitnessLevel ?? "intermediate", preferences.WorkoutDurationMinutes);
            var meals = GetMealsForDay(day, preferences.DietaryPreference ?? "balanced");

            days.Add($@"
DAY {day}:
WORKOUT: {workout}
MEALS: {meals}
");
        }

        return $@"Welcome to your personalized {preferences.DaysPerWeek}-day fitness and nutrition plan!

This plan is designed to help you progress from {preferences.CurrentWeightKg}kg to {preferences.TargetWeightKg}kg safely and effectively.
Each workout is approximately {preferences.WorkoutDurationMinutes} minutes and tailored for {preferences.FitnessLevel} fitness level with {preferences.DietaryPreference} dietary preferences.

{string.Join("\n", days)}

IMPORTANT NOTES:
- Stay hydrated throughout the day
- Listen to your body and rest when needed
- Warm up for 5-10 minutes before each workout
- Cool down and stretch after each session
- Adjust portion sizes based on your hunger and energy levels
- Consult with a healthcare professional before starting any new fitness program

Remember: Consistency is key! Stick to the plan and track your progress weekly.";
    }

    private string GetWorkoutForDay(int day, string fitnessLevel, int duration)
    {
        var workouts = new Dictionary<string, string[]>
        {
            ["beginner"] = new[]
            {
                $"Full Body Circuit ({duration} min): Bodyweight squats (3x12), Push-ups (3x8), Plank (3x30s), Walking lunges (3x10), Rest 60s between sets",
                $"Cardio Focus ({duration} min): 25 min brisk walk or jog, Light stretching, Core exercises (3x15 crunches, 3x20s plank), Cool down walk",
                $"Upper Body Strength ({duration} min): Wall push-ups (3x12), Dumbbell rows (3x10), Shoulder press (3x10), Bicep curls (3x12), Tricep extensions (3x12)",
                $"Lower Body & Core ({duration} min): Bodyweight squats (3x15), Glute bridges (3x12), Calf raises (3x15), Leg raises (3x10), Bird-dog (3x10 each side)",
                $"Active Recovery ({duration} min): 20 min yoga flow, Full body stretching, Focus on breathing and mobility, Light core activation"
            },
            ["intermediate"] = new[]
            {
                $"Strength Training ({duration} min): Barbell squats (4x8), Bench press (4x8), Bent-over rows (4x8), Plank (3x45s), Rest 90s between sets",
                $"HIIT Cardio ({duration} min): Warm up 5 min, Intervals: 1 min sprint/2 min walk (8 rounds), Burpees (4x10), Mountain climbers (4x20)",
                $"Push Day ({duration} min): Bench press (4x8), Shoulder press (4x10), Incline press (4x10), Tricep dips (4x12), Push-ups (4x15)",
                $"Pull Day ({duration} min): Pull-ups (4x6), Barbell rows (4x8), Lat pulldowns (4x10), Face pulls (4x12), Bicep curls (4x10)",
                $"Leg Day ({duration} min): Squats (4x8), Deadlifts (4x6), Lunges (4x10), Leg press (4x12), Calf raises (4x15)"
            },
            ["advanced"] = new[]
            {
                $"Power Training ({duration} min): Heavy squats (5x5), Power cleans (5x3), Box jumps (5x5), Sprints (8x100m), Rest 2-3 min between heavy sets",
                $"Volume Day ({duration} min): Squats (5x10), Bench press (5x10), Rows (5x10), Accessory work (3x15 each exercise), Minimal rest between sets",
                $"Strength Endurance ({duration} min): Circuit training - Deadlifts (3x12), Push press (3x12), Pull-ups (3x12), Burpees (3x20), Kettlebell swings (3x15)",
                $"Olympic Focus ({duration} min): Snatch practice (8x2), Clean & jerk (8x2), Front squats (4x6), Push press (4x8), Core stability work",
                $"Conditioning ({duration} min): AMRAP 20 min - 5 pull-ups, 10 push-ups, 15 air squats, 200m run, then skill work and mobility"
            }
        };

        var levelWorkouts = workouts[fitnessLevel.ToLower()];
        return levelWorkouts[(day - 1) % levelWorkouts.Length];
    }

    private string GetMealsForDay(int day, string dietaryPreference)
    {
        var meals = new Dictionary<string, string[]>
        {
            ["balanced"] = new[]
            {
                "Breakfast: Oatmeal with berries, almonds, and honey. Lunch: Grilled chicken salad with mixed greens, avocado, and vinaigrette. Dinner: Baked salmon with quinoa and roasted vegetables. Snack: Greek yogurt with granola.",
                "Breakfast: Scrambled eggs (2 whole + 2 whites) with whole wheat toast and spinach. Lunch: Turkey sandwich with whole grain bread, lettuce, tomato. Dinner: Lean beef stir-fry with brown rice and mixed vegetables. Snack: Apple with peanut butter.",
                "Breakfast: Protein smoothie (whey protein, banana, spinach, almond milk). Lunch: Tuna salad wrap with whole wheat tortilla and side salad. Dinner: Baked chicken breast with sweet potato and steamed broccoli. Snack: Mixed nuts and dried fruit.",
                "Breakfast: Greek yogurt parfait with layers of yogurt, berries, and granola. Lunch: Quinoa bowl with roasted vegetables, chickpeas, and tahini dressing. Dinner: Fish tacos with cabbage slaw and avocado. Snack: Rice cakes with almond butter.",
                "Breakfast: Whole grain pancakes with maple syrup and side of turkey sausage. Lunch: Chicken vegetable soup with whole grain crackers. Dinner: Pork tenderloin with roasted root vegetables and apple sauce. Snack: Protein bar and banana."
            },
            ["high-protein"] = new[]
            {
                "Breakfast: 3-egg omelette with cheese, mushrooms, and spinach. Lunch: 6oz chicken breast with steamed broccoli and cauliflower. Dinner: 8oz steak with asparagus and side salad. Snack: Protein shake with water.",
                "Breakfast: Protein pancakes made with protein powder and egg whites. Lunch: Tuna steak salad with hard-boiled eggs and olive oil dressing. Dinner: Ground turkey with zucchini noodles and marinara sauce. Snack: Beef jerky and string cheese.",
                "Breakfast: 1 cup cottage cheese with blueberries and walnuts. Lunch: Salmon fillet with green beans and almonds. Dinner: Lean beef patties with portobello mushrooms. Snack: 3 hard boiled eggs with salt and pepper.",
                "Breakfast: Greek yogurt mixed with protein powder and chia seeds. Lunch: Chicken thigh stir-fry with bell peppers and onions. Dinner: Pork chops with roasted Brussels sprouts. Snack: Protein pudding made with casein protein.",
                "Breakfast: 4 scrambled eggs with avocado and salsa. Lunch: Turkey breast wrap with lettuce instead of tortilla. Dinner: Cod fillet with spinach and lemon. Snack: Casein protein shake before bed."
            },
            ["vegetarian"] = new[]
            {
                "Breakfast: Tofu scramble with turmeric, black salt, and vegetables. Lunch: Lentil soup with whole grain bread. Dinner: Chickpea curry with brown rice. Snack: Steamed edamame with sea salt.",
                "Breakfast: Chia seed pudding made with almond milk and topped with berries. Lunch: Quinoa salad with roasted vegetables and feta cheese. Dinner: Vegetable stir-fry with tempeh and tamari. Snack: Roasted chickpeas with spices.",
                "Breakfast: Smoothie with plant protein, banana, kale, and flax seeds. Lunch: Black bean burgers on whole wheat buns with sweet potato fries. Dinner: Eggplant parmesan with side salad. Snack: Greek yogurt with honey.",
                "Breakfast: Oatmeal with walnuts, cinnamon, and maple syrup. Lunch: Mixed vegetable curry with coconut milk and basmati rice. Dinner: Stuffed bell peppers with rice and beans. Snack: Vegan protein bar.",
                "Breakfast: Avocado toast on sourdough with cherry tomatoes. Lunch: Spinach and feta pie with Greek salad. Dinner: Mushroom risotto with Parmesan cheese. Snack: Cottage cheese with pineapple."
            },
            ["low-carb"] = new[]
            {
                "Breakfast: Scrambled eggs with avocado and smoked salmon. Lunch: Chicken Caesar salad (no croutons) with Parmesan. Dinner: Ribeye steak with broccoli and butter. Snack: Cheese slices and olives.",
                "Breakfast: Bacon and eggs with sautéed mushrooms. Lunch: Tuna salad lettuce wraps with celery and mayo. Dinner: Pork chops with cauliflower mash and green beans. Snack: Handful of mixed nuts.",
                "Breakfast: Vegetable omelette with feta cheese. Lunch: Beef stir-fry with bok choy and soy sauce (no rice). Dinner: Baked cod with asparagus and hollandaise. Snack: Pepperoni slices and cheese.",
                "Breakfast: Full-fat Greek yogurt with a few berries. Lunch: Chicken vegetable soup (no noodles or rice). Dinner: Lamb chops with mint sauce and roasted radishes. Snack: Green olives and almonds.",
                "Breakfast: Smoothie with almond milk, protein powder, and spinach. Lunch: Egg salad on cucumber slices. Dinner: Turkey meatballs with zucchini noodles and pesto. Snack: Pork rinds with guacamole."
            }
        };

        var dietMeals = meals[dietaryPreference.ToLower()];
        return dietMeals[(day - 1) % dietMeals.Length];
    }
}

// Response classes
public class GroqResponse
{
    public Choice[]? choices { get; set; }
}

public class Choice
{
    public Message? message { get; set; }
}

public class Message
{
    public string? content { get; set; }
}

// Request classes
public class UserPreferences
{
    public double CurrentWeightKg { get; set; }
    public double TargetWeightKg { get; set; }
    public int WorkoutDurationMinutes { get; set; }
    public int DaysPerWeek { get; set; }
    public string? FitnessLevel { get; set; }
    public string? DietaryPreference { get; set; }
}