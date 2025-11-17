// FitzFrontend/app/full-plan.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface PlanData {
  text: string;
  params: {
    currentWeightKg: number;
    targetWeightKg: number;
    workoutDurationMinutes: number;
    daysPerWeek: number;
    fitnessLevel?: string;
    dietaryPreference?: string;
  };
  generatedAt: string;
}

export default function FullPlanScreen() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      if (storedPlan) {
        setPlanData(JSON.parse(storedPlan));
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      Alert.alert('Error', 'Failed to load your plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleDayExpansion = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  const formatPlanContent = () => {
    if (!planData?.text) return null;

    const content = planData.text;
    
    // Split by DAY pattern to get individual days
    const daySections = content.split(/(?=DAY \d+:)/i).filter(section => section.trim() && section.match(/DAY \d+:/i));
    
    // If no DAY sections found, try to create them from the content
    if (daySections.length === 0) {
      // Fallback: Create a single section with all content
      return [
        <Card key={0} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <View style={styles.dayTitleContainer}>
              <Text style={styles.dayNumber}>Complete Plan</Text>
              <Text style={styles.dayTitle}>Your Fitness & Nutrition Guide</Text>
            </View>
          </View>
          <View style={styles.dayContent}>
            <Text style={styles.fullContent}>{content}</Text>
          </View>
        </Card>
      ];
    }
    
    return daySections.map((section, index) => {
      const isExpanded = expandedDays.has(index);
      
      // Extract day number and title
      const dayMatch = section.match(/DAY (\d+):/i);
      const dayNumber = dayMatch ? parseInt(dayMatch[1]) : index + 1;
      
      // Extract workout section
      const workoutMatch = section.match(/WORKOUT:([\s\S]*?)(?=MEALS:|$)/i);
      const workoutContent = workoutMatch ? workoutMatch[1].trim() : 'Workout details not available';
      
      // Extract meals section  
      const mealsMatch = section.match(/MEALS:([\s\S]*?)(?=DAY \d+:|$)/i);
      const mealsContent = mealsMatch ? mealsMatch[1].trim() : 'Meal details not available';

      return (
        <Card key={index} style={styles.dayCard}>
          <TouchableOpacity 
            style={styles.dayHeader}
            onPress={() => toggleDayExpansion(index)}
            activeOpacity={0.7}
          >
            <View style={styles.dayTitleContainer}>
              <Text style={styles.dayNumber}>Day {dayNumber}</Text>
              <Text style={styles.dayTitle}>Daily Plan</Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={Colors.orange} 
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.dayContent}>
              {/* Workout Section */}
              {activeTab === 'workout' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="barbell-outline" size={20} color={Colors.terraCotta} />
                    <Text style={styles.sectionTitle}>Workout</Text>
                  </View>
                  <Text style={styles.sectionContent}>
                    {workoutContent}
                  </Text>
                </View>
              )}

              {/* Meal Section */}
              {activeTab === 'diet' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="restaurant-outline" size={20} color={Colors.orange} />
                    <Text style={styles.sectionTitle}>Meals</Text>
                  </View>
                  <Text style={styles.sectionContent}>
                    {mealsContent}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!planData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="fitness-outline" size={64} color={Colors.secondaryText} />
          <Text style={styles.noPlanTitle}>No Plan Generated</Text>
          <Text style={styles.noPlanText}>
            You haven't generated a fitness plan yet. Go to the Workouts tab to create your personalized plan!
          </Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <Text style={styles.generateButtonText}>Generate Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Complete Plan</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Plan Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Plan Overview</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="scale-outline" size={20} color={Colors.orange} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Current Weight</Text>
                <Text style={styles.summaryValue}>{planData.params.currentWeightKg} kg</Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="flag-outline" size={20} color={Colors.orange} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Target Weight</Text>
                <Text style={styles.summaryValue}>{planData.params.targetWeightKg} kg</Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={20} color={Colors.orange} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{planData.params.workoutDurationMinutes} min</Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.orange} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Days/Week</Text>
                <Text style={styles.summaryValue}>{planData.params.daysPerWeek}</Text>
              </View>
            </View>
          </View>
          
          {planData.params.fitnessLevel && (
            <View style={styles.extraInfo}>
              <Text style={styles.extraLabel}>Fitness Level: {planData.params.fitnessLevel}</Text>
              <Text style={styles.extraLabel}>Diet: {planData.params.dietaryPreference || 'Balanced'}</Text>
            </View>
          )}
        </Card>

        {/* Tab Navigation */}
        <Card style={styles.tabCard}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'workout' && styles.activeTab]}
              onPress={() => setActiveTab('workout')}
            >
              <Ionicons 
                name="barbell-outline" 
                size={20} 
                color={activeTab === 'workout' ? Colors.primaryText : Colors.secondaryText} 
              />
              <Text style={[styles.tabText, activeTab === 'workout' && styles.activeTabText]}>
                Workouts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'diet' && styles.activeTab]}
              onPress={() => setActiveTab('diet')}
            >
              <Ionicons 
                name="nutrition-outline" 
                size={20} 
                color={activeTab === 'diet' ? Colors.primaryText : Colors.secondaryText} 
              />
              <Text style={[styles.tabText, activeTab === 'diet' && styles.activeTabText]}>
                Nutrition
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Content Header */}
        <Card style={styles.contentHeaderCard}>
          <Text style={styles.contentTitle}>
            {activeTab === 'workout' ? 'Workout Schedule' : 'Meal Plan'}
          </Text>
          <Text style={styles.contentDescription}>
            {activeTab === 'workout' 
              ? `Your personalized ${planData.params.daysPerWeek}-day workout plan`
              : `Balanced nutrition to support your weight goal`
            }
          </Text>
        </Card>

        {/* Plan Content */}
        {formatPlanContent()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.orange} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>New Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Ionicons name="home-outline" size={20} color={Colors.primaryText} />
            <Text style={styles.actionButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.primaryText,
    fontWeight: '500',
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
    lineHeight: 22,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    backgroundColor: Colors.background, 
    borderColor: Colors.burgundy,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  extraInfo: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.terraCotta,
  },
  extraLabel: {
    fontSize: 14,
    color: Colors.orange,
    fontWeight: '600',
    marginBottom: 4,
  },
  tabCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.terraCotta,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginLeft: 8,
  },
  activeTabText: {
    color: Colors.primaryText,
  },
  contentHeaderCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.salmon,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 6,
    textAlign: 'center',
  },
  contentDescription: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  dayCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: Colors.darkRed,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: Colors.burgundy,
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 14,
    color: Colors.orange,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  dayContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: Colors.primaryText,
    lineHeight: 20,
  },
  fullContent: {
    fontSize: 14,
    color: Colors.primaryText,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: Colors.terraCotta,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: Colors.orange,
  },
  generateButton: {
    backgroundColor: Colors.terraCotta,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  generateButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});