// app/(tabs)/workouts.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple API URL configuration
const API_BASE_URL = Platform.OS === 'ios' 
  ? 'http://10.0.2.2:5089/api'
  : 'http://localhost:5089/api';

export default function WorkoutsScreen() {
  const user = useUser();
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [workoutDuration, setWorkoutDuration] = useState<string>('45');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('5');
  const [fitnessLevel, setFitnessLevel] = useState<string>('intermediate');
  const [dietaryPreference, setDietaryPreference] = useState<string>('balanced');
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);

  useEffect(() => {
    console.log('🏠 Workouts Screen - User has plan:', user?.hasExistingPlan);
    
    // If user already has a plan, redirect them to home
    if (user?.hasExistingPlan) {
      console.log('🔄 User has plan, redirecting to home');
      router.replace('/(tabs)/home');
    }

    // Pre-fill with user data if available
    if (user?.currentWeight) {
      setCurrentWeight(String(user.currentWeight));
    }
    if (user?.targetWeight) {
      setTargetWeight(String(user.targetWeight));
    }
  }, [user]);

  const generateAiPlan = async () => {
    console.log('🟡 Generate button clicked');
    
    if (!currentWeight || !targetWeight || !workoutDuration || !daysPerWeek) {
      console.log('❌ Missing fields:', { currentWeight, targetWeight, workoutDuration, daysPerWeek });
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    const currentWeightKg = parseFloat(currentWeight);
    const targetWeightKg = parseFloat(targetWeight);
    const workoutDurationMinutes = parseInt(workoutDuration);
    const daysPerWeekInt = parseInt(daysPerWeek);

    if (isNaN(currentWeightKg) || currentWeightKg <= 0 ||
        isNaN(targetWeightKg) || targetWeightKg <= 0 ||
        isNaN(workoutDurationMinutes) || workoutDurationMinutes <= 0 ||
        isNaN(daysPerWeekInt) || daysPerWeekInt <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid positive numbers for all fields.');
      return;
    }

    console.log('🟡 All fields filled, starting generation...');
    setGeneratingPlan(true);
    
    try {
      const requestBody = {
        currentWeightKg: currentWeightKg,
        targetWeightKg: targetWeightKg,
        workoutDurationMinutes: workoutDurationMinutes,
        daysPerWeek: daysPerWeekInt,
        fitnessLevel: fitnessLevel,
        dietaryPreference: dietaryPreference,
      };

      console.log('🟡 Request body:', requestBody);
      
      const apiUrl = `${API_BASE_URL}/generate_ai_plan`;
      console.log('🟡 API URL:', apiUrl);
      
      console.log('🟡 Making fetch request...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🟡 Response status:', response.status);
      console.log('🟡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        
        if (response.status === 403) {
          Alert.alert('API Error', 'Backend service is not properly configured. Please check API keys.');
        } else if (response.status === 500) {
          Alert.alert('Server Error', 'Internal server error. Please try again later.');
        } else if (response.status === 503) {
          Alert.alert('Service Unavailable', 'AI service is temporarily unavailable. Please wait a moment and try again.');
        } else {
          Alert.alert('Error', `Server error: ${response.status} - ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('✅ AI Response received:', data);

      if (data.aiResponse) {
        console.log('✅ AI plan generated successfully!');
        
        const planData = {
          text: data.aiResponse,
          params: requestBody,
          generatedAt: new Date().toISOString()
        };

        // Save the plan
        await AsyncStorage.setItem('lastGeneratedDietPlan', JSON.stringify(planData));
        console.log('💾 Plan saved to storage');
        
        // Force refresh by navigating directly
        console.log('🔄 Forcing navigation to home...');
        
        Alert.alert(
          'Success!', 
          'Your personalized fitness plan has been generated!',
          [
            {
              text: 'View My Plan',
              onPress: () => {
                console.log('🎯 Navigating to home dashboard');
                // Use replace to force a fresh load
                router.replace('/(tabs)/home');
              }
            }
          ]
        );
      } else {
        console.log('❌ No aiResponse in data:', data);
        Alert.alert('Error', 'No plan was generated. Please try again.');
      }

    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      Alert.alert('Connection Error', `Failed to connect to the server: ${error.message}`);
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Create Your Plan</Text>

        <Card style={styles.onboardingCard}>
          <View style={styles.welcomeSection}>
            <Ionicons name="sparkles" size={48} color={Colors.orange} />
            <Text style={styles.cardTitle}>Welcome to Your Fitness Journey!</Text>
            <Text style={styles.subtitle}>
              Let's create your personalized AI-powered fitness and nutrition plan
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Your Goals</Text>
          
          <Text style={styles.inputLabel}>Current Weight (kg)*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 70"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={currentWeight}
            onChangeText={setCurrentWeight}
          />

          <Text style={styles.inputLabel}>Target Weight (kg)*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 65"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={targetWeight}
            onChangeText={setTargetWeight}
          />

          <Text style={styles.sectionTitle}>Workout Preferences</Text>

          <Text style={styles.inputLabel}>Workout Duration (minutes)*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 45"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={workoutDuration}
            onChangeText={setWorkoutDuration}
          />

          <Text style={styles.inputLabel}>Days per Week*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={daysPerWeek}
            onChangeText={setDaysPerWeek}
          />

          <Text style={styles.inputLabel}>Fitness Level</Text>
          <View style={styles.optionRow}>
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  fitnessLevel === level && styles.optionButtonSelected
                ]}
                onPress={() => setFitnessLevel(level)}
              >
                <Text style={[
                  styles.optionText,
                  fitnessLevel === level && styles.optionTextSelected
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Nutrition Preferences</Text>

          <Text style={styles.inputLabel}>Dietary Preference</Text>
          <View style={styles.optionRow}>
            {['balanced', 'high-protein', 'vegetarian', 'low-carb'].map((diet) => (
              <TouchableOpacity
                key={diet}
                style={[
                  styles.optionButton,
                  dietaryPreference === diet && styles.optionButtonSelected
                ]}
                onPress={() => setDietaryPreference(diet)}
              >
                <Text style={[
                  styles.optionText,
                  dietaryPreference === diet && styles.optionTextSelected
                ]}>
                  {diet.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateButton, generatingPlan && styles.generateButtonDisabled]}
            onPress={generateAiPlan}
            disabled={generatingPlan}
          >
            {generatingPlan ? (
              <ActivityIndicator color={Colors.primaryText} />
            ) : (
              <>
                <Ionicons name="sparkles" size={24} color={Colors.primaryText} />
                <Text style={styles.generateButtonText}>Generate My AI Plan</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            * Our AI will create a personalized {daysPerWeek || '5'}-day plan with workouts and meals tailored to your goals and preferences.
          </Text>
        </Card>

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
    marginTop: 20,
  },
  onboardingCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.orange,
    marginTop: 20,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange,
    paddingLeft: 12,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 5,
    borderColor: Colors.orange,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    margin: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.terraCotta,
    borderColor: Colors.terraCotta,
  },
  optionText: {
    fontSize: 14,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: Colors.terraCotta,
    borderRadius: 12,
    padding: 16,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: Colors.border,
  },
  generateButtonText: {
    color: Colors.primaryText,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});