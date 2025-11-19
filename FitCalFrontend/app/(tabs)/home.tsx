// app/(tabs)/home.tsx - DARK MODE + QUOTES
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colours';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../_layout';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlanData {
  text: string;
  params: any;
  generatedAt: string;
}

const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Action is the foundational key to all success.",
  "Don't wish for it. Work for it.",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "Your body can stand almost anything. It’s your mind that you have to convince.",
  "Success starts with self-discipline.",
  "The pain you feel today will be the strength you feel tomorrow."
];

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<string>('');
  const [todayMeals, setTodayMeals] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const user = useUser();
 
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    };
    updateDateTime();
    
    // Set Random Quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);

    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      if (storedPlan) {
        const planData: PlanData = JSON.parse(storedPlan);
        setCurrentPlan(planData);
        parseTodaysContent(planData.text, planData.params?.daysPerWeek || 5);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  const parseTodaysContent = (aiText: string, totalDays: number) => {
    try {
      const today = new Date().getDay();
      const dayIndex = today === 0 ? totalDays - 1 : today - 1;
      const currentDay = Math.min(dayIndex, totalDays - 1) + 1;

      const dayPattern = new RegExp(`DAY ${currentDay}:([\\s\\S]*?)(?=DAY ${currentDay + 1}:|$)`, 'i');
      const dayMatch = aiText.match(dayPattern);

      if (dayMatch) {
        const dayContent = dayMatch[0];
        const workoutMatch = dayContent.match(/WORKOUT:([\s\\S]*?)(?=MEALS:|$)/i);
        const mealsMatch = dayContent.match(/MEALS:([\s\\S]*?)(?=DAY |$)/i);
        
        setTodayWorkout(workoutMatch ? workoutMatch[1].trim() : 'Full body workout details in plan');
        setTodayMeals(mealsMatch ? mealsMatch[1].trim() : 'Balanced meal details in plan');
      } else {
        setTodayWorkout('Check full plan for workout details');
        setTodayMeals('Check full plan for meal details');
      }
    } catch (error) {
      setTodayWorkout('Workout details available in full plan');
      setTodayMeals('Meal details available in full plan');
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Athlete';
  const profileImageUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=ffffff&size=150`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // --- RENDER: NO PLAN STATE ---
  if (currentPlan === null && !user?.hasExistingPlan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greetingLabel}>{getGreeting()}</Text>
                <Text style={styles.headerTitle}>{displayName}</Text>
              </View>
              <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
            </View>
          </View>

          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBubble}>
              <Ionicons name="fitness-outline" size={48} color={Colors.orange} />
            </View>
            <Text style={styles.emptyTitle}>Ready to Start?</Text>
            <Text style={styles.emptySubtitle}>
              Build your personalized AI fitness & nutrition roadmap in seconds.
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/workouts')}
            >
              <Text style={styles.primaryButtonText}>Generate My Plan</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- RENDER: DASHBOARD STATE ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Dashboard Style */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingLabel}>{currentDate}</Text>
              <Text style={styles.headerTitle}>{displayName}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
               <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.planBadgeContainer}>
            <View style={styles.planBadge}>
              <Ionicons name="sparkles" size={12} color="#FFF" />
              <Text style={styles.planBadgeText}>
                {currentPlan?.params?.daysPerWeek ? `${currentPlan.params.daysPerWeek}-Day Active Plan` : 'Active Plan'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quote Widget */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <Ionicons name="bulb" size={16} color={Colors.orange} />
            <Text style={styles.quoteTitle}>Daily Motivation</Text>
          </View>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(231, 111, 81, 0.2)' }]}>
              <Ionicons name="flame" size={20} color={Colors.terraCotta} />
            </View>
            <Text style={styles.statValue}>{currentPlan?.params?.workoutDurationMinutes || '45'}</Text>
            <Text style={styles.statLabel}>Mins/Day</Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(42, 157, 143, 0.2)' }]}>
              <Ionicons name="barbell" size={20} color="#2A9D8F" />
            </View>
            <Text style={styles.statValue}>{currentPlan?.params?.daysPerWeek || '5'}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(244, 162, 97, 0.2)' }]}>
              <Ionicons name="scale" size={20} color={Colors.orange} />
            </View>
            <Text style={styles.statValue}>{currentPlan?.params?.targetWeightKg || '--'}</Text>
            <Text style={styles.statLabel}>Target Kg</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>

        {/* Main Widget: Workout */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/full-plan')}
          style={styles.widgetContainer}
        >
          <View style={[styles.widgetLeftStrip, { backgroundColor: Colors.terraCotta }]} />
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Workout Focus</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </View>
            <Text numberOfLines={3} style={styles.widgetBody}>
              {todayWorkout}
            </Text>
            <View style={styles.widgetFooter}>
              <View style={styles.tag}>
                <Ionicons name="time-outline" size={12} color="#CCC" />
                <Text style={styles.tagText}>{currentPlan?.params?.workoutDurationMinutes || 45} min</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Main Widget: Nutrition */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/full-plan')}
          style={styles.widgetContainer}
        >
          <View style={[styles.widgetLeftStrip, { backgroundColor: Colors.orange }]} />
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Nutrition Plan</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </View>
            <Text numberOfLines={3} style={styles.widgetBody}>
              {todayMeals}
            </Text>
            <View style={styles.widgetFooter}>
              <View style={styles.tag}>
                <Ionicons name="nutrition-outline" size={12} color="#CCC" />
                <Text style={styles.tagText}>Healthy & Balanced</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/workouts')}>
            <View style={[styles.actionIconCircle, { backgroundColor: Colors.terraCotta }]}>
              <Ionicons name="refresh" size={22} color="#FFF" />
            </View>
            <Text style={styles.actionCardTitle}>Regenerate</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/full-plan')}>
            <View style={[styles.actionIconCircle, { backgroundColor: Colors.orange }]}>
              <Ionicons name="list" size={22} color="#FFF" />
            </View>
            <Text style={styles.actionCardTitle}>Full Plan</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#000000' // Pure Black
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  
  // Header
  headerSection: { 
    paddingTop: 20, 
    marginBottom: 24 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  greetingLabel: { 
    fontSize: 14, 
    color: '#A1A1A1', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 4
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#FFFFFF',
    letterSpacing: -0.5
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 16,
    borderWidth: 2, 
    borderColor: '#333',
  },
  planBadgeContainer: {
    flexDirection: 'row',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', // Dark Surface
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },

  // Quote Card
  quoteCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.orange
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6
  },
  quoteTitle: {
    color: Colors.orange,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  quoteText: {
    color: '#FFF',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '500'
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark Surface
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Widgets
  widgetContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E', // Dark Surface
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 130,
  },
  widgetLeftStrip: {
    width: 6,
    height: '100%',
  },
  widgetContent: {
    flex: 1,
    padding: 20,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  widgetBody: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
    marginBottom: 12,
  },
  widgetFooter: {
    flexDirection: 'row',
    marginTop: 'auto',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E', // Slightly lighter gray for pill
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#CCC',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Actions
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark Surface
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    marginTop: 10,
  },
  emptyIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 111, 81, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#FFF', // White Button for high contrast
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});