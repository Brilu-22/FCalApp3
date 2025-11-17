// app/(tabs)/home.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../_layout';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface PlanData {
  text: string;
  params: any;
  generatedAt: string;
}

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<string>('');
  const [todayMeals, setTodayMeals] = useState<string>('');
  const user = useUser();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    };
    updateDateTime();

    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      console.log('🏠 Home screen - Loading current plan...');
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      console.log('🏠 Stored plan found:', !!storedPlan);
      
      if (storedPlan) {
        const planData: PlanData = JSON.parse(storedPlan);
        console.log('🏠 Plan data loaded:', planData);
        setCurrentPlan(planData);
        
        // Parse today's content from the raw AI text
        parseTodaysContent(planData.text, planData.params?.daysPerWeek || 5);
      } else {
        console.log('🏠 No stored plan found');
      }
    } catch (error) {
      console.error('🏠 Error loading plan:', error);
    }
  };

  const parseTodaysContent = (aiText: string, totalDays: number) => {
    try {
      const today = new Date().getDay();
      const dayIndex = today === 0 ? totalDays - 1 : today - 1;
      const currentDay = Math.min(dayIndex, totalDays - 1) + 1;

      console.log(`🏠 Parsing content for day ${currentDay} of ${totalDays}`);

      // Look for the specific day in the AI response
      const dayPattern = new RegExp(`DAY ${currentDay}:([\\s\\S]*?)(?=DAY ${currentDay + 1}:|$)`, 'i');
      const dayMatch = aiText.match(dayPattern);

      if (dayMatch) {
        const dayContent = dayMatch[0]; // Use the full match
        
        // Extract workout
        const workoutMatch = dayContent.match(/WORKOUT:([\s\\S]*?)(?=MEALS:|$)/i);
        if (workoutMatch) {
          setTodayWorkout(workoutMatch[1].trim());
        } else {
          setTodayWorkout('Full body workout with strength training and cardio');
        }

        // Extract meals
        const mealsMatch = dayContent.match(/MEALS:([\s\\S]*?)(?=DAY |$)/i);
        if (mealsMatch) {
          setTodayMeals(mealsMatch[1].trim());
        } else {
          setTodayMeals('Balanced meals focusing on protein and complex carbohydrates');
        }
      } else {
        // Fallback to first day
        const firstDayMatch = aiText.match(/DAY 1:([\\s\\S]*?)(?=DAY 2:|$)/i);
        if (firstDayMatch) {
          const firstDayContent = firstDayMatch[0];
          const workoutMatch = firstDayContent.match(/WORKOUT:([\s\\S]*?)(?=MEALS:|$)/i);
          const mealsMatch = firstDayContent.match(/MEALS:([\s\\S]*?)(?=DAY |$)/i);
          
          setTodayWorkout(workoutMatch ? workoutMatch[1].trim() : 'Check full plan for workout details');
          setTodayMeals(mealsMatch ? mealsMatch[1].trim() : 'Check full plan for meal details');
        } else {
          // Generic content if parsing fails
          setTodayWorkout('Workout details available in full plan');
          setTodayMeals('Meal details available in full plan');
        }
      }
    } catch (error) {
      console.error('🏠 Error parsing today\'s content:', error);
      setTodayWorkout('Workout details available in full plan');
      setTodayMeals('Meal details available in full plan');
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Fitness Enthusiast';
  const profileImageUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=ffffff&size=150`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Show loading state while checking for plan
  if (currentPlan === null && !user?.hasExistingPlan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userName}>{displayName}</Text>
              </View>
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            </View>
          </View>

          <Card style={styles.noPlanCard}>
            <Ionicons name="barbell-outline" size={64} color={Colors.orange} />
            <Text style={styles.noPlanTitle}>Welcome to Your Fitness Journey!</Text>
            <Text style={styles.noPlanText}>
              Get started by creating your personalized AI-powered fitness and nutrition plan.
            </Text>
            <TouchableOpacity 
              style={styles.createPlanButton}
              onPress={() => router.push('/(tabs)/workouts')}
            >
              <Ionicons name="sparkles" size={20} color={Colors.primaryText} />
              <Text style={styles.createPlanButtonText}>Create Your Plan</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show actual plan content
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          </View>
          
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.dayHighlight}>
              {currentPlan?.params?.daysPerWeek ? `${currentPlan.params.daysPerWeek}-Day Plan` : 'Your Plan'}
            </Text>
          </View>
        </View>

        {/* Today's Workout */}
        <Card style={styles.todayCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="barbell" size={24} color={Colors.terraCotta} />
            <Text style={styles.cardTitle}>Today's Workout</Text>
          </View>
          <Text style={styles.planContent}>
            {todayWorkout || 'Full body workout with strength training and cardio exercises'}
          </Text>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push('/full-plan')}
          >
            <Text style={styles.viewDetailsText}>View Full Workout Plan</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.terraCotta} />
          </TouchableOpacity>
        </Card>

        {/* Today's Meals */}
        <Card style={styles.todayCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant" size={24} color={Colors.orange} />
            <Text style={styles.cardTitle}>Today's Nutrition</Text>
          </View>
          <Text style={styles.planContent}>
            {todayMeals || 'Balanced meals with protein, complex carbs, and healthy fats'}
          </Text>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push('/full-plan')}
          >
            <Text style={styles.viewDetailsText}>View Full Meal Plan</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.orange} />
          </TouchableOpacity>
        </Card>

        {/* Progress Overview */}
        <Card style={styles.progressCard}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <View style={styles.progressGrid}>
            <View style={styles.progressItem}>
              <Ionicons name="calendar" size={24} color={Colors.salmon} />
              <Text style={styles.progressNumber}>
                {currentPlan?.params?.daysPerWeek || '5'}
              </Text>
              <Text style={styles.progressLabel}>Day Plan</Text>
            </View>
            <View style={styles.progressItem}>
              <Ionicons name="time" size={24} color={Colors.terraCotta} />
              <Text style={styles.progressNumber}>
                {currentPlan?.params?.workoutDurationMinutes || '45'}
              </Text>
              <Text style={styles.progressLabel}>Minutes</Text>
            </View>
            <View style={styles.progressItem}>
              <Ionicons name="trending-up" size={24} color={Colors.orange} />
              <Text style={styles.progressNumber}>
                {currentPlan?.params?.targetWeightKg || '0'}kg
              </Text>
              <Text style={styles.progressLabel}>Goal Weight</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/workouts')}
            >
              <Ionicons name="refresh" size={24} color={Colors.terraCotta} />
              <Text style={styles.actionText}>New Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/full-plan')}
            >
              <Ionicons name="document-text" size={24} color={Colors.orange} />
              <Text style={styles.actionText}>Full Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={24} color={Colors.salmon} />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  headerSection: { paddingVertical: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greetingText: { fontSize: 18, color: Colors.secondaryText, marginBottom: 4 },
  userName: { fontSize: 28, fontWeight: 'bold', color: Colors.primaryText },
  profileImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: Colors.terraCotta },
  dateTimeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 16, color: Colors.primaryText, fontWeight: '600' },
  dayHighlight: { fontSize: 16, color: Colors.orange, fontWeight: 'bold' },
  noPlanCard: { alignItems: 'center', justifyContent: 'center', padding: 40, marginVertical: 20 },
  noPlanTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primaryText, marginTop: 20, marginBottom: 12, textAlign: 'center' },
  noPlanText: { fontSize: 16, color: Colors.secondaryText, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  createPlanButton: { backgroundColor: Colors.terraCotta, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  createPlanButtonText: { color: Colors.primaryText, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  todayCard: { marginBottom: 16, padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.primaryText, marginLeft: 8 },
  planContent: { fontSize: 14, color: Colors.primaryText, lineHeight: 20, marginBottom: 16 },
  viewDetailsButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  viewDetailsText: { color: Colors.terraCotta, fontSize: 14, fontWeight: '600', marginRight: 4 },
  progressCard: { marginBottom: 16, padding: 20 },
  progressGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  progressItem: { alignItems: 'center', flex: 1 },
  progressNumber: { fontSize: 20, fontWeight: 'bold', color: Colors.primaryText, marginTop: 8 },
  progressLabel: { fontSize: 12, color: Colors.secondaryText, marginTop: 4 },
  actionsCard: { marginBottom: 24, padding: 20 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionButton: { alignItems: 'center', flex: 1, padding: 12 },
  actionText: { fontSize: 12, color: Colors.primaryText, marginTop: 8, textAlign: 'center' },
});