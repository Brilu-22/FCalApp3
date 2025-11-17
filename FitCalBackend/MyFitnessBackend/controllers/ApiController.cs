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

IMPORTANT: For each day, provide SPECIFIC WORKOUT exercises with sets, reps, and rest periods.

Structure each day EXACTLY like this:
DAY [Number]:
WORKOUT: [Specific exercises with sets/reps - e.g., Barbell Squats: 3 sets of 8-12 reps, 60s rest; Bench Press: 3 sets of 8-12 reps, 60s rest]
MEALS: [Breakfast, lunch, dinner, and snacks with specific food suggestions]

WORKOUT REQUIREMENTS:
- Include specific exercises with sets, reps, and rest periods
- Focus on compound movements for {preferences.FitnessLevel} level
- Target different muscle groups each day
- Include warm-up and cool-down instructions
- Make workouts practical for {preferences.WorkoutDurationMinutes} minutes

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
- Warm up for 5-10 minutes before each workout
- Cool down and stretch after each session  
- Stay hydrated throughout the day
- Listen to your body and rest when needed
- Adjust weights based on your strength level
- Consult with a healthcare professional before starting any new fitness program

Remember: Consistency is key! Stick to the plan and track your progress weekly.";
    }

    private string GetWorkoutForDay(int day, string fitnessLevel, int duration)
    {
        var workouts = new Dictionary<string, string[]>
        {
            ["beginner"] = new[]
            {
                $"Full Body Circuit ({duration} min): Warm-up: 5 min light cardio. Barbell Squats: 3 sets of 10-12 reps, 60s rest. Bench Press: 3 sets of 10-12 reps, 60s rest. Bent-over Rows: 3 sets of 10-12 reps, 60s rest. Shoulder Press: 3 sets of 10-12 reps, 60s rest. Plank: 3 sets of 30s, 30s rest. Cool-down: 5 min stretching.",
                $"Cardio & Core ({duration} min): Warm-up: 5 min brisk walk. Treadmill: 20 min interval training (1 min run/2 min walk). Russian Twists: 3 sets of 15 reps, 30s rest. Leg Raises: 3 sets of 12 reps, 30s rest. Mountain Climbers: 3 sets of 20 reps, 30s rest. Cool-down: 5 min walking and stretching.",
                $"Upper Body Strength ({duration} min): Warm-up: 5 min arm circles and light weights. Dumbbell Press: 3 sets of 10-12 reps, 60s rest. Lat Pulldowns: 3 sets of 10-12 reps, 60s rest. Bicep Curls: 3 sets of 12-15 reps, 45s rest. Tricep Extensions: 3 sets of 12-15 reps, 45s rest. Push-ups: 3 sets to failure, 60s rest. Cool-down: 5 min stretching.",
                $"Lower Body Focus ({duration} min): Warm-up: 5 min dynamic stretching. Goblet Squats: 3 sets of 12-15 reps, 60s rest. Lunges: 3 sets of 10 reps per leg, 60s rest. Leg Press: 3 sets of 12-15 reps, 60s rest. Calf Raises: 3 sets of 15-20 reps, 45s rest. Glute Bridges: 3 sets of 15 reps, 45s rest. Cool-down: 5 min stretching.",
                $"Active Recovery ({duration} min): Yoga flow: 25 min full body sequence. Core work: Bird-dog 3 sets of 10 reps per side, Dead Bug 3 sets of 12 reps. Light cardio: 10 min stationary bike. Full body stretching: 10 min focused on flexibility."
            },
            ["intermediate"] = new[]
            {
                $"Chest & Triceps ({duration} min): Warm-up: 5 min. Barbell Bench Press: 4 sets of 8-12 reps, 90s rest. Incline Dumbbell Press: 3 sets of 8-12 reps, 75s rest. Cable Flyes: 3 sets of 12-15 reps, 60s rest. Tricep Dips: 3 sets of 10-15 reps, 60s rest. Skull Crushers: 3 sets of 10-12 reps, 60s rest. Push-ups: 3 sets to failure. Cool-down: 5 min.",
                $"Back & Biceps ({duration} min): Warm-up: 5 min. Deadlifts: 4 sets of 6-8 reps, 120s rest. Pull-ups: 3 sets of 6-10 reps, 90s rest. Barbell Rows: 3 sets of 8-12 reps, 75s rest. Lat Pulldowns: 3 sets of 10-12 reps, 60s rest. Barbell Curls: 3 sets of 8-12 reps, 60s rest. Hammer Curls: 3 sets of 10-12 reps, 60s rest. Cool-down: 5 min.",
                $"Leg Day ({duration} min): Warm-up: 5 min dynamic stretches. Barbell Squats: 4 sets of 8-12 reps, 120s rest. Romanian Deadlifts: 3 sets of 8-12 reps, 90s rest. Leg Press: 3 sets of 10-15 reps, 75s rest. Leg Extensions: 3 sets of 12-15 reps, 60s rest. Leg Curls: 3 sets of 12-15 reps, 60s rest. Calf Raises: 4 sets of 15-20 reps, 45s rest. Cool-down: 5 min.",
                $"Shoulders & Abs ({duration} min): Warm-up: 5 min. Military Press: 4 sets of 8-12 reps, 90s rest. Lateral Raises: 3 sets of 12-15 reps, 60s rest. Front Raises: 3 sets of 12-15 reps, 60s rest. Cable Crunches: 3 sets of 15-20 reps, 45s rest. Hanging Leg Raises: 3 sets of 10-15 reps, 60s rest. Plank: 3 sets of 60s. Cool-down: 5 min.",
                $"Full Body HIIT ({duration} min): Warm-up: 5 min. Circuit (4 rounds): Kettlebell Swings x15, Box Jumps x10, Burpees x10, Mountain Climbers x30, Rest 60s between rounds. Core finisher: Russian Twists x50, Leg Raises x20. Cool-down: 5 min stretching."
            },
            ["advanced"] = new[]
            {
                $"Power Training ({duration} min): Warm-up: 10 min. Power Cleans: 5 sets of 3 reps, 180s rest. Push Press: 4 sets of 5 reps, 120s rest. Box Jumps: 4 sets of 5 reps, 90s rest. Medicine Ball Slams: 3 sets of 10 reps, 60s rest. Sprints: 8x100m with 90s rest. Cool-down: 10 min.",
                $"Volume Chest ({duration} min): Warm-up: 5 min. Bench Press: 5 sets of 10 reps, 90s rest. Incline DB Press: 4 sets of 12 reps, 75s rest. Decline Press: 3 sets of 12 reps, 75s rest. Cable Crossovers: 3 sets of 15 reps, 60s rest. Push-ups: 3 sets to failure. Cool-down: 5 min.",
                $"Back Destruction ({duration} min): Warm-up: 5 min. Deadlifts: 5 sets of 5 reps, 180s rest. Weighted Pull-ups: 4 sets of 6-8 reps, 120s rest. T-bar Rows: 4 sets of 8-10 reps, 90s rest. Single-arm DB Rows: 3 sets of 10-12 reps, 75s rest. Face Pulls: 3 sets of 15 reps, 60s rest. Cool-down: 5 min.",
                $"Legs Intensity ({duration} min): Warm-up: 10 min. Squats: 5 sets of 5 reps, 180s rest. Front Squats: 4 sets of 6-8 reps, 120s rest. Lunges: 3 sets of 10 reps per leg, 90s rest. Leg Press: 3 sets of 15-20 reps, 75s rest. Calf Raises: 5 sets of 20 reps, 45s rest. Cool-down: 10 min.",
                $"Conditioning ({duration} min): AMRAP 20 min: 5 Pull-ups, 10 Push-ups, 15 Air Squats, 20 Mountain Climbers. Then: Farmer's Walks 4x50m, Battle Ropes 4x30s. Cool-down: 10 min mobility work."
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