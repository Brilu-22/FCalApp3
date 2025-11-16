// ENHANCED HOME SCREEN - REPLACE YOUR CURRENT ONE
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../_layout';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardData {
  currentPlan: {
    currentWeightKg: number;
    targetWeightKg: number;
    workoutPlan: string;
    mealPlan: string;
    weightProgress: number;
    completedWorkouts: number;
    totalWorkouts: number;
  };
  weightProgressPercentage: number;
  workoutCompletionRate: number;
  weightHistory: Array<{ date: string; weight: number }>;
  weeklyProgress: Array<{ date: string; completed: boolean; workoutType: string }>;
}

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const user = useUser();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    // Check for existing plan
    checkForExistingPlan();

    return () => clearInterval(interval);
  }, []);

  const checkForExistingPlan = async () => {
    try {
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      setHasPlan(!!storedPlan);
      
      if (storedPlan) {
        // In a real app, you'd fetch from your backend API
        // For now, create mock dashboard data from stored plan
        const plan = JSON.parse(storedPlan);
        const mockDashboardData: DashboardData = {
          currentPlan: {
            currentWeightKg: plan.params.currentWeightKg,
            targetWeightKg: plan.params.targetWeightKg,
            workoutPlan: "Your AI Generated Workouts",
            mealPlan: "Your AI Generated Meals",
            weightProgress: 2.5, // Mock progress
            completedWorkouts: 3, // Mock completed
            totalWorkouts: plan.params.daysPerWeek
          },
          weightProgressPercentage: 50,
          workoutCompletionRate: 60,
          weightHistory: [
            { date: '4w ago', weight: plan.params.currentWeightKg + 2.5 },
            { date: '3w ago', weight: plan.params.currentWeightKg + 1.5 },
            { date: '2w ago', weight: plan.params.currentWeightKg + 0.8 },
            { date: '1w ago', weight: plan.params.currentWeightKg + 0.3 },
            { date: 'Now', weight: plan.params.currentWeightKg }
          ],
          weeklyProgress: [
            { date: 'Mon', completed: true, workoutType: 'Upper Body' },
            { date: 'Tue', completed: true, workoutType: 'Lower Body' },
            { date: 'Wed', completed: false, workoutType: 'Cardio' },
            { date: 'Thu', completed: true, workoutType: 'Upper Body' },
            { date: 'Fri', completed: false, workoutType: 'Lower Body' },
            { date: 'Sat', completed: true, workoutType: 'Rest' },
            { date: 'Sun', completed: false, workoutType: 'Cardio' }
          ]
        };
        setDashboardData(mockDashboardData);
      }
    } catch (error) {
      console.error('Error checking for plan:', error);
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

  if (!hasPlan) {
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
              <Ionicons name="sparkles-outline" size={20} color={Colors.primaryText} />
              <Text style={styles.createPlanButtonText}>Create Your Plan</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        {/* Progress Overview */}
        <Card style={styles.progressCard}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          
          <View style={styles.progressGrid}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Weight Progress</Text>
              <Text style={styles.progressValue}>{dashboardData?.weightProgressPercentage}%</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${dashboardData?.weightProgressPercentage ?? 0}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Workouts Completed</Text>
              <Text style={styles.progressValue}>
                {dashboardData?.currentPlan.completedWorkouts}/{dashboardData?.currentPlan.totalWorkouts}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${dashboardData?.workoutCompletionRate ?? 0}%`,
                      backgroundColor: Colors.terraCotta
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Weight Trend Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>Weight Trend</Text>
          <View style={styles.chartContainer}>
            {dashboardData?.weightHistory.map((point, index) => (
              <View key={index} style={styles.chartPoint}>
                <View 
                  style={[
                    styles.chartBar,
                    { 
                      height: Math.max(20, (point.weight / Math.max(...dashboardData.weightHistory.map(p => p.weight))) * 60)
                    }
                  ]}
                />
                <Text style={styles.chartLabel}>{point.date}</Text>
                <Text style={styles.chartWeight}>{point.weight}kg</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Weekly Workout Progress */}
        <Card style={styles.workoutCard}>
          <Text style={styles.cardTitle}>This Week's Workouts</Text>
          <View style={styles.weekGrid}>
            {dashboardData?.weeklyProgress.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <View style={[
                  styles.dayCircle,
                  day.completed ? styles.completedDay : styles.incompleteDay
                ]}>
                  <Text style={styles.dayText}>{day.date}</Text>
                </View>
                <Text style={styles.workoutType} numberOfLines={1}>
                  {day.workoutType}
                </Text>
              </View>
            ))}
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
              <Ionicons name="barbell-outline" size={24} color={Colors.terraCotta} />
              <Text style={styles.actionText}>Workouts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/dietary-plan')}
            >
              <Ionicons name="restaurant-outline" size={24} color={Colors.orange} />
              <Text style={styles.actionText}>Nutrition</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/full-plan')}
            >
              <Ionicons name="document-text-outline" size={24} color={Colors.salmon} />
              <Text style={styles.actionText}>Full Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-outline" size={24} color={Colors.burgundy} />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

// ADD THESE STYLES TO YOUR EXISTING STYLES:
const styles = StyleSheet.create({
  // ... keep all your existing styles from home.tsx,
  // and add these new ones:

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  // Header / profile styles
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryText,
    marginTop: 4,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  dateTimeContainer: {
    marginTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  timeText: {
    fontSize: 14,
    color: Colors.primaryText,
    marginTop: 2,
  },

  noPlanCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 16,
    backgroundColor: Colors.darkRed,
  },
  noPlanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  noPlanText: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createPlanButton: {
    backgroundColor: Colors.terraCotta,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPlanButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressCard: {
    marginBottom: 16,
    padding: 20,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.burgundy,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: 4,
  },
  chartCard: {
    marginBottom: 16,
    padding: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
  },
  chartPoint: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: 20,
    backgroundColor: Colors.terraCotta,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  chartWeight: {
    fontSize: 10,
    color: Colors.primaryText,
    marginTop: 4,
  },
  workoutCard: {
    marginBottom: 16,
    padding: 20,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedDay: {
    backgroundColor: Colors.terraCotta,
  },
  incompleteDay: {
    backgroundColor: Colors.burgundy,
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  workoutType: {
    fontSize: 10,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: 24,
    padding: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: Colors.primaryText,
    marginTop: 8,
    textAlign: 'center',
  },

  // Common card title style used across Cards
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 8,
  },
});