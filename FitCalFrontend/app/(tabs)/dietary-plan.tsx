// FitzFrontend/app/(tabs)/dietary-plan.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamic API URL based on platform
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5089/api';
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:5089/api';
    }
  }
  return 'https://your-production-url.com/api';
};

const API_BASE_URL = getBaseUrl();

// Define interfaces
interface MealItem {
  name: string;
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  image_url?: string;
}

interface DailyPlan {
  day: string;
  meals: {
    breakfast: MealItem;
    lunch: MealItem;
    dinner: MealItem;
    snacks: MealItem[];
  };
}

// Helper to generate a placeholder image URL based on meal name
const generateImageUrl = (mealName: string) => {
  const query = encodeURIComponent(mealName + " healthy food");
  return `https://source.unsplash.com/300x200/?${query}`;
};

// SIMPLIFIED PARSER - This will definitely work with your AI response format
const parseAiPlanResponse = (aiTextResponse: string, numDays: number): DailyPlan[] => {
  console.log('Starting to parse AI response...');
  const parsedPlans: DailyPlan[] = [];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Split by "Day X:" sections
  const daySections = aiTextResponse.split(/Day \d+:/).filter(section => section.trim().length > 0);
  
  console.log(`Found ${daySections.length} day sections`);

  for (let i = 0; i < Math.min(daySections.length, numDays); i++) {
    const daySection = daySections[i];
    const dayName = daysOfWeek[i % 7];

    console.log(`Processing ${dayName}, section content:`, daySection.substring(0, 200));

    // Create default plan for this day
    const dailyPlan: DailyPlan = {
      day: dayName,
      meals: {
        breakfast: { 
          name: 'Breakfast', 
          description: 'No breakfast details available', 
          image_url: generateImageUrl('breakfast')
        },
        lunch: { 
          name: 'Lunch', 
          description: 'No lunch details available', 
          image_url: generateImageUrl('lunch')
        },
        dinner: { 
          name: 'Dinner', 
          description: 'No dinner details available', 
          image_url: generateImageUrl('dinner')
        },
        snacks: [],
      },
    };

    // SIMPLE EXTRACTION - Look for meal patterns in the text
    const lines = daySection.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Look for breakfast
    const breakfastLine = lines.find(line => line.toLowerCase().includes('breakfast'));
    if (breakfastLine) {
      const description = breakfastLine.replace(/breakfast:\s*/gi, '').trim();
      if (description && description.length > 0) {
        dailyPlan.meals.breakfast = {
          name: 'Breakfast',
          description: description,
          image_url: generateImageUrl('breakfast')
        };
      }
    }

    // Look for lunch
    const lunchLine = lines.find(line => line.toLowerCase().includes('lunch'));
    if (lunchLine) {
      const description = lunchLine.replace(/lunch:\s*/gi, '').trim();
      if (description && description.length > 0) {
        dailyPlan.meals.lunch = {
          name: 'Lunch',
          description: description,
          image_url: generateImageUrl('lunch')
        };
      }
    }

    // Look for dinner
    const dinnerLine = lines.find(line => line.toLowerCase().includes('dinner'));
    if (dinnerLine) {
      const description = dinnerLine.replace(/dinner:\s*/gi, '').trim();
      if (description && description.length > 0) {
        dailyPlan.meals.dinner = {
          name: 'Dinner',
          description: description,
          image_url: generateImageUrl('dinner')
        };
      }
    }

    // Look for snacks
    const snackLines = lines.filter(line => 
      line.toLowerCase().includes('snack') && 
      !line.toLowerCase().includes('snacks:') &&
      line.length > 10
    );
    
    dailyPlan.meals.snacks = snackLines.map((line, index) => ({
      name: `Snack ${index + 1}`,
      description: line.replace(/snack\s*\d*\s*:?\s*/gi, '').trim(),
      image_url: generateImageUrl('snack')
    })).filter(snack => snack.description.length > 0);

    // If we found actual meal data, use it
    const hasRealData = breakfastLine || lunchLine || dinnerLine || snackLines.length > 0;
    if (hasRealData) {
      parsedPlans.push(dailyPlan);
      console.log(`Added ${dayName} with meals`);
    }
  }

  // Fallback: If parsing failed completely, create placeholder plans
  if (parsedPlans.length === 0) {
    console.log('No meals found in AI response, creating placeholder plans');
    for (let i = 0; i < numDays; i++) {
      parsedPlans.push({
        day: daysOfWeek[i % 7],
        meals: {
          breakfast: { 
            name: 'Sample Breakfast', 
            description: 'Greek yogurt with berries and chia seeds', 
            image_url: generateImageUrl('breakfast')
          },
          lunch: { 
            name: 'Sample Lunch', 
            description: 'Grilled chicken salad with mixed greens', 
            image_url: generateImageUrl('lunch')
          },
          dinner: { 
            name: 'Sample Dinner', 
            description: 'Baked salmon with roasted vegetables', 
            image_url: generateImageUrl('dinner')
          },
          snacks: [
            { name: 'Morning Snack', description: 'Apple with peanut butter', image_url: generateImageUrl('snack') },
            { name: 'Afternoon Snack', description: 'Handful of almonds', image_url: generateImageUrl('snack') }
          ],
        },
      });
    }
  }

  console.log(`Final parsed plans:`, parsedPlans.length);
  return parsedPlans;
};

export default function DietaryPlanScreen() {
  const [dietPlan, setDietPlan] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastGeneratedPlanRaw, setLastGeneratedPlanRaw] = useState<{ text: string, params: any } | null>(null);

  const fetchDietPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      console.log('Stored plan found:', !!storedPlan);
      
      if (storedPlan) {
        const { text, params } = JSON.parse(storedPlan);
        console.log('Plan params:', params);
        console.log('AI response length:', text.length);
        console.log('AI response sample:', text.substring(0, 500));
        
        setLastGeneratedPlanRaw({ text, params });
        
        // Parse the plan
        const parsedPlan = parseAiPlanResponse(text, params.daysPerWeek || 5);
        console.log('Parsed plan:', parsedPlan);
        
        setDietPlan(parsedPlan);
      } else {
        console.log('No stored plan found');
        setDietPlan([]);
      }
    } catch (e: any) {
      console.error('Failed to load stored diet plan:', e);
      setError('Failed to load stored plan: ' + e.message);
      setDietPlan([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDietPlan();
    }, [fetchDietPlan])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDietPlan();
  }, [fetchDietPlan]);

  const renderMealItem = (meal: MealItem, mealType: string) => (
    <View style={styles.mealItemContainer}>
      <Image 
        source={{ uri: meal.image_url }} 
        style={styles.mealImage}
        onError={(e) => console.log('Image failed to load:', e.nativeEvent.error)}
      />
      <View style={styles.mealDetails}>
        <Text style={styles.mealType}>{mealType}</Text>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealDescription}>{meal.description}</Text>
        
        {/* Nutrition info placeholder - we'll add Edamam later */}
        <View style={styles.nutritionContainer}>
          <Text style={styles.nutritionTitle}>Nutrition Information</Text>
          <Text style={styles.nutritionUnavailable}>
            Detailed nutrition analysis coming soon with Edamam integration
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading your dietary plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.generatePlanButton} onPress={() => router.push('./workouts')}>
            <Text style={styles.generatePlanButtonText}>Generate New Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentDayPlan = dietPlan[selectedDayIndex];
  console.log('Current day plan:', currentDayPlan);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        <Text style={styles.header}>Your Dietary Plan</Text>

        {dietPlan.length === 0 || !currentDayPlan ? (
          <Card style={styles.noPlanCard}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.secondaryText} />
            <Text style={styles.noPlanTitle}>No Dietary Plan Found</Text>
            <Text style={styles.noPlanText}>Generate a personalized plan to see your meals!</Text>
            <TouchableOpacity style={styles.generatePlanButton} onPress={() => router.push('./workouts')}>
              <Ionicons name="sparkles-outline" size={20} color={Colors.primaryText} />
              <Text style={styles.generatePlanButtonText}>Generate Plan</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            {/* Day Selector */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.daySelector}
              contentContainerStyle={styles.daySelectorContent}
            >
              {dietPlan.map((plan, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton, 
                    index === selectedDayIndex && styles.dayButtonSelected
                  ]}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text style={[
                    styles.dayButtonText, 
                    index === selectedDayIndex && styles.dayButtonTextSelected
                  ]}>
                    {plan.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day Summary */}
            <Card style={styles.daySummaryCard}>
              <Text style={styles.dayTitle}>{currentDayPlan.day} Meals</Text>
              {lastGeneratedPlanRaw?.params && (
                <Text style={styles.targetInfo}>
                  Weight Goal: {lastGeneratedPlanRaw.params.currentWeightKg}kg to {lastGeneratedPlanRaw.params.targetWeightKg}kg
                </Text>
              )}
            </Card>

            {/* Meals */}
            <Card style={styles.mealCard}>
              {renderMealItem(currentDayPlan.meals.breakfast, "Breakfast")}
            </Card>

            <Card style={styles.mealCard}>
              {renderMealItem(currentDayPlan.meals.lunch, "Lunch")}
            </Card>

            <Card style={styles.mealCard}>
              {renderMealItem(currentDayPlan.meals.dinner, "Dinner")}
            </Card>

            {currentDayPlan.meals.snacks.length > 0 && (
              <Card style={styles.mealCard}>
                <Text style={styles.snacksHeader}>Snacks</Text>
                {currentDayPlan.meals.snacks.map((snack, index) => (
                  <View key={index}>
                    {renderMealItem(snack, `Snack ${index + 1}`)}
                    {index < currentDayPlan.meals.snacks.length - 1 && (
                      <View style={styles.snackSeparator} />
                    )}
                  </View>
                ))}
              </Card>
            )}

            <TouchableOpacity 
              style={styles.generatePlanButton} 
              onPress={() => router.push('./workouts')}
            >
              <Ionicons name="refresh-outline" size={20} color={Colors.primaryText} />
              <Text style={styles.generatePlanButtonText}>Generate New Plan</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryText,
    margin: 20,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.primaryText,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: Colors.red,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 22,
  },
  noPlanCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    margin: 20,
    marginTop: 40,
    backgroundColor: Colors.darkRed, // Added new color
  },
  noPlanTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  noPlanText: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  generatePlanButton: {
    backgroundColor: Colors.terraCotta, // Updated to new color
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  generatePlanButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  daySelector: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  daySelectorContent: {
    paddingHorizontal: 4,
  },
  dayButton: {
    backgroundColor: Colors.background,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.burgundy, // Updated to new color
  },
  dayButtonSelected: {
    backgroundColor: Colors.orange, // Updated to new color
    borderColor: Colors.orange, // Updated to new color
  },
  dayButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  dayButtonTextSelected: {
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  daySummaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.burgundy, // Added new color
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  targetInfo: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mealCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: Colors.darkRed, // Added new color
  },
  mealItemContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: Colors.border,
  },
  mealDetails: {
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    color: Colors.salmon, // Updated to new color
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  mealDescription: {
    fontSize: 14,
    color: Colors.primaryText,
    lineHeight: 20,
    marginBottom: 8,
  },
  nutritionContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.terraCotta, // Added new color
  },
  nutritionTitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '600',
    marginBottom: 4,
  },
  nutritionUnavailable: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  snacksHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
    color: Colors.orange, // Updated to new color
  },
  snackSeparator: {
    height: 1,
    backgroundColor: Colors.terraCotta, // Updated to new color
    marginHorizontal: 16,
  },
});