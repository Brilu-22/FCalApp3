// FitzFrontend/app/(tabs)/home.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../_layout';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
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

    return () => clearInterval(interval);
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Fitness Enthusiast';
  const profileImageUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=ffffff&size=150`;

  // Calculate weight progress
  const currentWeight = user?.currentWeight || 0;
  const targetWeight = user?.targetWeight || 0;
  const weightDifference = currentWeight - targetWeight;
  const progressPercentage = targetWeight > 0 ? Math.min(Math.max((Math.abs(weightDifference) / Math.max(currentWeight, targetWeight)) * 100, 0), 100) : 0;

  // Mock fitness data
  const fitnessData = {
    steps: { current: 12457, target: 15000, progress: 83 },
    calories: { current: 1843, target: 2200, progress: 84 },
    water: { current: 1.8, target: 2.5, progress: 72 },
    activity: { current: 45, target: 60, progress: 75 }
  };

  // Weight trend data
  const weightTrend = [
    { week: 'W1', weight: currentWeight + 2 },
    { week: 'W2', weight: currentWeight + 1.5 },
    { week: 'W3', weight: currentWeight + 0.8 },
    { week: 'W4', weight: currentWeight },
    { week: 'Now', weight: currentWeight }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Simple circular progress indicator
  const SimpleProgressCircle = ({ progress, size = 80, children }: { progress: number; size?: number; children: React.ReactNode }) => {
    return (
      <View style={[styles.simpleProgressContainer, { width: size, height: size }]}>
        <View style={[styles.simpleProgressOuter, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[styles.simpleProgressInner, { 
            width: size - 8, 
            height: size - 8, 
            borderRadius: (size - 8) / 2 
          }]} />
        </View>
        <View style={[styles.simpleProgressIndicator, { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          transform: [{ rotate: `${-90 + (progress * 3.6)}deg` }]
        }]} />
        <View style={styles.progressCircleContent}>
          {children}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Premium Header Section */}
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

        {/* Quick Stats Overview - Final Layout */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              {/* Words at the top */}
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Steps</Text>
                <Text style={styles.statTarget}>{fitnessData.steps.progress}% of goal</Text>
              </View>
              
              {/* Icon in the middle */}
              <View style={styles.statIconContainer}>
                <SimpleProgressCircle progress={fitnessData.steps.progress}>
                  <Ionicons name="footsteps-outline" size={24} color={Colors.accent} />
                </SimpleProgressCircle>
              </View>
              
              {/* Number at the bottom */}
              <Text style={styles.statNumber}>{fitnessData.steps.current.toLocaleString()}</Text>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              {/* Words at the top */}
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statTarget}>{fitnessData.calories.progress}% of goal</Text>
              </View>
              
              {/* Icon in the middle */}
              <View style={styles.statIconContainer}>
                <SimpleProgressCircle progress={fitnessData.calories.progress}>
                  <Ionicons name="flame-outline" size={24} color={Colors.accent} />
                </SimpleProgressCircle>
              </View>
              
              {/* Number at the bottom */}
              <Text style={styles.statNumber}>{fitnessData.calories.current.toLocaleString()}</Text>
            </View>
          </Card>
        </View>

        {/* Weight Progress Section */}
        <Card style={styles.weightCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="trending-up-outline" size={24} color={Colors.accent} />
              <Text style={styles.cardTitle}>Weight Journey</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil-outline" size={16} color={Colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.weightProgress}>
            <View style={styles.weightNumbers}>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Current</Text>
                <Text style={styles.weightValue}>{currentWeight || '--'} kg</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Target</Text>
                <Text style={styles.weightValue}>{targetWeight || '--'} kg</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Progress</Text>
                <Text style={[styles.weightValue, 
                  weightDifference > 0 ? styles.weightLoss : styles.weightGain
                ]}>
                  {currentWeight && targetWeight ? `${Math.abs(weightDifference)} kg ${weightDifference > 0 ? 'to lose' : 'gained'}` : 'Set goals'}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>{targetWeight || '--'}kg</Text>
                <Text style={styles.progressLabel}>{currentWeight || '--'}kg</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: weightDifference > 0 ? '#10b981' : Colors.accent
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Mini Trend Visualization */}
            <View style={styles.trendContainer}>
              <Text style={styles.trendTitle}>Weekly Trend</Text>
              <View style={styles.trendChart}>
                {weightTrend.map((point, index) => (
                  <View key={index} style={styles.trendPoint}>
                    <View 
                      style={[
                        styles.trendBar,
                        { 
                          height: Math.max(20, (point.weight / Math.max(...weightTrend.map(p => p.weight))) * 40),
                          backgroundColor: index === weightTrend.length - 1 ? Colors.accent : Colors.border
                        }
                      ]}
                    />
                    <Text style={styles.trendLabel}>{point.week}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Actions - 2x2 Grid Layout */}
        <Card style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {/* Top Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('./(tabs)/workouts')}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="barbell-outline" size={24} color={Colors.accent} />
                </View>
                <Text style={styles.actionText}>Workouts</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('./(tabs)/dietary-plan')}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="restaurant-outline" size={24} color="#10b981" />
                </View>
                <Text style={styles.actionText}>Nutrition</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="water-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.actionText}>Hydration</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="bed-outline" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.actionText}>Sleep</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Daily Motivation */}
        <Card style={styles.motivationCard}>
          <View style={styles.motivationContent}>
            <Ionicons name="sparkles" size={32} color={Colors.accent} />
            <View style={styles.motivationText}>
              <Text style={styles.motivationTitle}>Daily Motivation</Text>
              <Text style={styles.motivationQuote}>
                "The only bad workout is the one that didn't happen."
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
  },
  headerSection: {
    paddingVertical: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: Colors.terraCotta, // Updated to new color
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 16,
    color: Colors.orange, // Updated to new color
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    borderColor: Colors.burgundy,
  },
  statCard: {
    flex: 1,
    padding: 24,
    borderColor: Colors.burgundy,
    borderWidth: 1,
    backgroundColor: Colors.background,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 180,
  },
  statTextContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  statTarget: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  statIconContainer: {
    marginVertical: 16,
  },
  statNumber: {
    fontSize: 15, // Reduced from 22 to 18
    fontWeight: 'light',
    color: Colors.primaryText,
    marginTop: 4,
  },
  // Simple progress circle styles
  simpleProgressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleProgressOuter: {
    position: 'absolute',
    backgroundColor: Colors.burgundy, // Updated to new color
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleProgressInner: {
    backgroundColor: Colors.background,
  },
  simpleProgressIndicator: {
    position: 'absolute',
    backgroundColor: Colors.terraCotta, // Updated to new color
    opacity: 0.3,
  },
  progressCircleContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  weightCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: Colors.background, 
    borderColor: Colors.burgundy,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginLeft: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.darkRed, // Updated to new color
  },
  weightProgress: {
    gap: 20,
  },
  weightNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weightItem: {
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  weightLoss: {
    color: Colors.salmon, // Updated to new color
  },
  weightGain: {
    color: Colors.terraCotta, // Updated to new color
  },
  progressContainer: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.burgundy, // Updated to new color
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.terraCotta, // Updated to new color
  },
  trendContainer: {
    gap: 12,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
  },
  trendPoint: {
    alignItems: 'center',
    flex: 1,
  },
  trendBar: {
    width: 12,
    borderRadius: 6,
    marginBottom: 6,
    minHeight: 4,
    backgroundColor: Colors.orange, // Updated to new color
  },
  trendLabel: {
    fontSize: 10,
    color: Colors.secondaryText,
  },
  actionsCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: Colors.darkRed, // Added new color
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 20,
  },
  actionsGrid: {
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.burgundy, // Updated to new color
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.terraCotta, // Updated to new color
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.terraCotta, // Updated to new color
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    textAlign: 'center',
  },
  motivationCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: Colors.darkRed, // Updated to new color
    borderLeftWidth: 4,
    borderLeftColor: Colors.orange, // Updated to new color
  },
  motivationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationText: {
    flex: 1,
    marginLeft: 12,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  motivationQuote: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});