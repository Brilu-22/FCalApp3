// FitzFrontend/app/(tabs)/workouts.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../_layout'; // Import useUser to get current/target weight
import AsyncStorage from '@react-native-async-storage/async-storage'; // To store the generated plan

// Dynamic API URL based on platform
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5089/api';
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:5089/api';
    }
  }
  return 'https://your-production-url.com/api'; // For production
};

const API_BASE_URL = getBaseUrl();

const humanSilhouetteImage = 'https://share.google/images/ZCcBjrGRN5784Q8wZ'; // Placeholder

export default function WorkoutsScreen() {
  const user = useUser(); // Get user data from context
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  // State for AI Plan Generation Inputs
  const [currentWeight, setCurrentWeight] = useState<string>(user?.currentWeight ? String(user.currentWeight) : '');
  const [targetWeight, setTargetWeight] = useState<string>(user?.targetWeight ? String(user.targetWeight) : '');
  const [workoutDuration, setWorkoutDuration] = useState<string>('45'); // Default 45 mins
  const [daysPerWeek, setDaysPerWeek] = useState<string>('5'); // Default 5 days
  const [prompt, setPrompt] = useState<string>(''); // Optional additional prompt
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);

  useEffect(() => {
    // Update weights if user data changes
    if (user) {
      if (user.currentWeight && String(user.currentWeight) !== currentWeight) {
        setCurrentWeight(String(user.currentWeight));
      }
      if (user.targetWeight && String(user.targetWeight) !== targetWeight) {
        setTargetWeight(String(user.targetWeight));
      }
    }
  }, [user]);

  const handleBodyPartSelect = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    Alert.alert(`Selected: ${bodyPart}`, `You've selected to focus on ${bodyPart}. This can be used to customize your AI plan.`);
  };

  const generateAiPlan = async () => {
    if (!currentWeight || !targetWeight || !workoutDuration || !daysPerWeek) {
      Alert.alert('Missing Info', 'Please fill in all required fields for plan generation.');
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

    setGeneratingPlan(true);
    try {
      const requestBody = {
        currentWeightKg,
        targetWeightKg,
        workoutDurationMinutes,
        daysPerWeek: daysPerWeekInt,
        prompt: prompt,
      };

      // FIXED: Added the missing slash between api and generate_ai_plan
      const apiUrl = `${API_BASE_URL}/generate_ai_plan`;
      console.log('Sending request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        Alert.alert('Error Generating Plan', `Server error: ${response.status} - ${errorText}`);
        return;
      }

      // Try to parse JSON
      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        Alert.alert('Response Error', 'Failed to parse server response');
        return;
      }

      const aiResponseText = data.aiResponse;
      if (aiResponseText) {
        Alert.alert('Plan Generated!', 'Your new fitness and dietary plan has been successfully generated!');
        // Store the raw text and parameters in AsyncStorage
        await AsyncStorage.setItem('lastGeneratedDietPlan', JSON.stringify({ text: aiResponseText, params: requestBody }));
        router.push('/(tabs)/full-plan'); // Navigate to the full plan screen to show the new plan
      } else {
        Alert.alert('No Plan Received', 'The AI generated a response, but no plan text could be extracted.');
      }

    } catch (error: any) {
      console.error('Network or parsing error:', error);
      Alert.alert('Connection Error', `Failed to connect to the backend: ${error.message}`);
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Workouts & Plans</Text>

        {/* Current Workout/Plan Card (could display a summary of the AI plan) */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Plan Summary</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(tabs)/full-plan')}>
              <Ionicons name="eye-outline" size={20} color={Colors.orange} />
            </TouchableOpacity>
          </View>
          <Text style={styles.workoutName}>Your AI Generated Plan</Text>
          <Text style={styles.secondaryText}>Tap "View Full Plan" to see details.</Text>
          <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/(tabs)/full-plan')}>
            <Text style={styles.seeAllButtonText}>View Full Plan</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.orange} />
          </TouchableOpacity>
          
        </Card>

        {/* Generate AI Plan Card */}
        <Card>
          <Text style={styles.cardTitle}>Generate Personalized AI Plan</Text>
          <Text style={styles.inputLabel}>Current Weight (kg):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 70"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={currentWeight}
            onChangeText={setCurrentWeight}
          />
          <Text style={styles.inputLabel}>Target Weight (kg):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 65"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={targetWeight}
            onChangeText={setTargetWeight}
          />
          <Text style={styles.inputLabel}>Workout Duration (minutes per session):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 45"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={workoutDuration}
            onChangeText={setWorkoutDuration}
          />
          <Text style={styles.inputLabel}>Days to workout per week:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="numeric"
            value={daysPerWeek}
            onChangeText={setDaysPerWeek}
          />
          <Text style={styles.inputLabel}>Additional Prompt (optional):</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., 'Focus on strength training, low impact activities'"
            placeholderTextColor={Colors.secondaryText}
            multiline
            numberOfLines={4}
            value={prompt}
            onChangeText={setPrompt}
          />
          <TouchableOpacity
            style={[styles.generateNewPlanButton, generatingPlan && styles.generateNewPlanButtonDisabled]}
            onPress={generateAiPlan}
            disabled={generatingPlan}
          >
            {generatingPlan ? (
              <ActivityIndicator color={Colors.primaryText} />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={24} color={Colors.primaryText} />
                <Text style={styles.generateNewPlanButtonText}>Generate AI Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* Human Anatomy Silhouette for Selection (Kept for visual appeal/future use) */}
        <Card style={styles.anatomyCard}>
          <Text style={styles.cardTitle}>Select Body Part to Exercise</Text>
          <View style={styles.silhouetteContainer}>
            <Image
              source={{ uri: humanSilhouetteImage }}
              style={styles.silhouetteImage}
              resizeMode="contain"
            />
            {/* Interactive overlay - these positions would be fine-tuned */}
            <TouchableOpacity
              style={[styles.bodyPartZone, styles.zoneHead]}
              onPress={() => handleBodyPartSelect('Shoulders')}
            ><Text style={styles.zoneText}>Shoulders</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.bodyPartZone, styles.zoneChest]}
              onPress={() => handleBodyPartSelect('Chest')}
            ><Text style={styles.zoneText}>Chest</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.bodyPartZone, styles.zoneArms]}
              onPress={() => handleBodyPartSelect('Arms')}
            ><Text style={styles.zoneText}>Arms</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.bodyPartZone, styles.zoneCore]}
              onPress={() => handleBodyPartSelect('Core')}
            ><Text style={styles.zoneText}>Core</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.bodyPartZone, styles.zoneLegs]}
              onPress={() => handleBodyPartSelect('Legs')}
            ><Text style={styles.zoneText}>Legs</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.bodyPartZone, styles.zoneBack]}
              onPress={() => handleBodyPartSelect('Back')}
            ><Text style={styles.zoneText}>Back</Text></TouchableOpacity>
          </View>
          {selectedBodyPart && (
            <Text style={styles.selectedBodyPartText}>Selected: {selectedBodyPart}</Text>
          )}
        </Card>

        {/* Workout History/Calendar Card (Can be populated from generated plans or logged workouts) */}
        <Card>
          <Text style={styles.cardTitle}>History</Text>
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>Mon, Oct 23</Text>
            <Text style={styles.historyDetails}>Upper Body - 45 min</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>Sat, Oct 21</Text>
            <Text style={styles.historyDetails}>Cardio & Abs - 30 min</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllButtonText}>See all workouts</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.orange} />
          </TouchableOpacity>
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
    margin: 16,
    marginTop: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 10,
  },
  editButton: {
    padding: 4,
    backgroundColor: Colors.darkRed, // Added new color
    borderRadius: 6,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.terraCotta, // Updated to new color
    marginTop: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 8,
  },
  lineBreak: {
    height: 1,
    backgroundColor: Colors.burgundy, // Updated to new color
    marginVertical: 12,
  },
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  workoutStatItem: {
    alignItems: 'center',
    backgroundColor: Colors.darkRed, // Added new color
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  smallText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.burgundy, // Updated to new color
    backgroundColor: Colors.darkRed, // Added new color
    borderRadius: 8,
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 16,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  historyDetails: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    backgroundColor: Colors.orange, // Added new color
    padding: 10,
    borderRadius: 8,
  },
  seeAllButtonText: {
    color: Colors.primaryText, // Updated for better contrast
    marginRight: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  generateNewPlanButton: {
    backgroundColor: Colors.terraCotta, // Updated to new color
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateNewPlanButtonDisabled: {
    backgroundColor: Colors.border, // Dimmed color when disabled
  },
  generateNewPlanButtonText: {
    color: Colors.primaryText,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  anatomyCard: {
    alignItems: 'center',
    backgroundColor: Colors.background, // Added new color
    padding: 16,
    borderRadius: 12,
  },
  silhouetteContainer: {
    width: 300,
    height: 500,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.8, // Make zones more visible
  },
  bodyPartZone: {
    position: 'absolute',
    backgroundColor: 'rgba(195, 61, 22, 0.3)', // Updated to terraCotta with transparency
    borderRadius: 10,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.terraCotta, // Updated to new color
    borderWidth: 1,
  },
  zoneText: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Example positions - these would require careful tuning based on the actual image
  zoneHead: { top: 10, left: '35%', width: '30%', height: 60 },
  zoneChest: { top: 120, left: '25%', width: '50%', height: 80 },
  zoneArms: { top: 180, left: 10, width: 80, height: 100 },
  zoneCore: { top: 220, left: '30%', width: '40%', height: 80 },
  zoneBack: { top: 200, right: 10, width: 80, height: 100 }, 
  zoneLegs: { bottom: 20, left: '20%', width: '60%', height: 180 },
  selectedBodyPartText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 8,
    marginTop: 15,
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
  textArea: {
    height: 100, // Make multiline input taller
    textAlignVertical: 'top', // Aligns text to the top
    borderColor: Colors.salmon, // Updated to new color
  }
});