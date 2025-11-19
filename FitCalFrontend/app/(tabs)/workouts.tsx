// app/(tabs)/workouts.tsx - DARK MODE
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '../../constants/Colours';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5089/api/AIPlan';

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
    if (user?.hasExistingPlan) {
      router.replace('/(tabs)/home');
    }
    if (user?.currentWeight) setCurrentWeight(String(user.currentWeight));
    if (user?.targetWeight) setTargetWeight(String(user.targetWeight));
  }, [user]);

  const generateAiPlan = async () => {
    if (!currentWeight || !targetWeight || !workoutDuration || !daysPerWeek) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    const currentWeightKg = parseFloat(currentWeight);
    const targetWeightKg = parseFloat(targetWeight);
    const workoutDurationMinutes = parseInt(workoutDuration);
    const daysPerWeekInt = parseInt(daysPerWeek);

    if (isNaN(currentWeightKg) || isNaN(targetWeightKg) || isNaN(workoutDurationMinutes) || isNaN(daysPerWeekInt)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers.');
      return;
    }

    setGeneratingPlan(true);

    try {
      const requestBody = {
        currentWeightKg,
        targetWeightKg,
        workoutDurationMinutes,
        daysPerWeek: daysPerWeekInt,
        fitnessLevel,
        dietaryPreference,
      };

      const apiUrl = `${API_BASE_URL}/generate_ai_plan`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Server error');
      const data = await response.json();

      if (data.aiResponse) {
        const planData = {
          text: data.aiResponse,
          params: requestBody,
          generatedAt: new Date().toISOString()
        };
        await AsyncStorage.setItem('lastGeneratedDietPlan', JSON.stringify(planData));
        Alert.alert('Success!', 'Plan generated!', [
          { text: 'View My Plan', onPress: () => router.replace('/(tabs)/home') }
        ]);
      } else {
        Alert.alert('Error', 'No plan content found.');
      }
    } catch (error: any) {
      Alert.alert('Connection Error', `Failed to connect: ${error.message}`);
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Design Your Plan</Text>
            <Text style={styles.headerSubtitle}>
              Tell us your goals, and our AI will build a perfect routine for you.
            </Text>
          </View>

          {/* Form Container - Dark Mode Surface */}
          <View style={styles.formContainer}>
            
            <Text style={styles.sectionLabel}>Body Metrics</Text>
            <View style={styles.rowGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current (kg)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target (kg)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Constraints</Text>
            <View style={styles.rowGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration (min)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={16} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="45"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={workoutDuration}
                    onChangeText={setWorkoutDuration}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Days/Week</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={16} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={daysPerWeek}
                    onChangeText={setDaysPerWeek}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Experience Level</Text>
            <View style={styles.chipsContainer}>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setFitnessLevel(level)}
                  style={[
                    styles.chip,
                    fitnessLevel === level && styles.chipSelected
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    fitnessLevel === level && styles.chipTextSelected
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Dietary Style</Text>
            <View style={styles.chipsContainer}>
              {['balanced', 'high-protein', 'vegetarian', 'low-carb'].map((diet) => (
                <TouchableOpacity
                  key={diet}
                  onPress={() => setDietaryPreference(diet)}
                  style={[
                    styles.chip,
                    dietaryPreference === diet && styles.chipSelected
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    dietaryPreference === diet && styles.chipTextSelected
                  ]}>
                    {diet.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, generatingPlan && styles.submitButtonDisabled]}
              onPress={generateAiPlan}
              disabled={generatingPlan}
              activeOpacity={0.8}
            >
              {generatingPlan ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Generate Plan</Text>
                  <Ionicons name="sparkles" size={20} color="#000" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              AI will generate a {daysPerWeek}-day routine based on these metrics.
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', // Pure Black
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  headerSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    lineHeight: 22,
  },

  // Main Form Card (Dark Mode)
  formContainer: {
    backgroundColor: '#1C1C1E', // Dark Surface
    borderRadius: 24,
    padding: 24,
  },
  
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  rowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#2C2C2E', // Input Surface
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    height: '100%',
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(231, 111, 81, 0.2)',
    borderColor: Colors.terraCotta,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  chipTextSelected: {
    color: Colors.terraCotta,
    fontWeight: '700',
  },

  submitButton: {
    backgroundColor: '#FFFFFF', // White button for contrast
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#444',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
});