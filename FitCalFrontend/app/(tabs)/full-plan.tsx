// FitzFrontend/app/full-plan.tsx - DARK MODE
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Platform,
  Dimensions 
} from 'react-native';
import { Colors } from '../../constants/Colours';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

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
      Alert.alert('Error', 'Failed to load your plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleDayExpansion = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) newExpanded.delete(dayIndex);
    else newExpanded.add(dayIndex);
    setExpandedDays(newExpanded);
  };

  const formatPlanContent = () => {
    if (!planData?.text) return null;
    const content = planData.text;
    
    const daySections = content.split(/(?=DAY \d+:)/i).filter(section => section.trim() && section.match(/DAY \d+:/i));
    
    if (daySections.length === 0) {
      return (
        <View style={styles.dayCard}>
          <View style={styles.dayHeader}>
             <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>FULL</Text>
             </View>
             <Text style={styles.dayTitle}>Complete Guide</Text>
          </View>
          <View style={styles.dayBody}>
            <Text style={styles.bodyText}>{content}</Text>
          </View>
        </View>
      );
    }
    
    return daySections.map((section, index) => {
      const isExpanded = expandedDays.has(index);
      const dayMatch = section.match(/DAY (\d+):/i);
      const dayNumber = dayMatch ? dayMatch[1] : index + 1;
      
      const workoutMatch = section.match(/WORKOUT:([\s\S]*?)(?=MEALS:|$)/i);
      const workoutContent = workoutMatch ? workoutMatch[1].trim() : 'Details in full summary.';
      
      const mealsMatch = section.match(/MEALS:([\s\S]*?)(?=DAY \d+:|$)/i);
      const mealsContent = mealsMatch ? mealsMatch[1].trim() : 'Details in full summary.';

      return (
        <TouchableOpacity 
          key={index} 
          style={styles.dayCard}
          activeOpacity={0.9}
          onPress={() => toggleDayExpansion(index)}
        >
          <View style={styles.dayHeader}>
            <View style={styles.dayHeaderLeft}>
              <View style={[styles.dayBadge, isExpanded && styles.dayBadgeActive]}>
                <Text style={[styles.dayBadgeText, isExpanded && styles.dayBadgeTextActive]}>DAY {dayNumber}</Text>
              </View>
              <Text style={styles.dayTitle}>
                {activeTab === 'workout' ? 'Training' : 'Nutrition'}
              </Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#888" 
            />
          </View>

          {isExpanded && (
            <View style={styles.dayBody}>
              <View style={styles.contentBlock}>
                <Text style={styles.bodyText}>
                  {activeTab === 'workout' ? workoutContent : mealsContent}
                </Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.metaTag}>
                  <Ionicons 
                    name={activeTab === 'workout' ? "time-outline" : "flame-outline"} 
                    size={14} 
                    color="#888" 
                  />
                  <Text style={styles.metaText}>
                    {activeTab === 'workout' ? `${planData.params.workoutDurationMinutes} mins` : 'Healthy Choice'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.terraCotta} />
          <Text style={styles.loadingText}>Constructing your roadmap...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!planData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={40} color={Colors.orange} />
          </View>
          <Text style={styles.noPlanTitle}>No Plan Found</Text>
          <Text style={styles.noPlanText}>
            Head over to the Workouts tab to generate your first AI fitness plan.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <Text style={styles.primaryButtonText}>Create Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Web View Container for centering on desktop */}
      <View style={styles.webContainer}>
        
        {/* Top Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          
          {/* Big Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Your Blueprint</Text>
            <Text style={styles.headerSubtitle}>Personalized AI Roadmap</Text>
          </View>

          {/* Dashboard Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconBg}>
                 <Ionicons name="flag-outline" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>{planData.params.targetWeightKg}<Text style={styles.statUnit}>kg</Text></Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconBg}>
                 <Ionicons name="hourglass-outline" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{planData.params.workoutDurationMinutes}<Text style={styles.statUnit}>m</Text></Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconBg}>
                 <Ionicons name="calendar-outline" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Freq</Text>
                <Text style={styles.statValue}>{planData.params.daysPerWeek}<Text style={styles.statUnit}>/wk</Text></Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconBg}>
                 <Ionicons name="fitness-outline" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Level</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {planData.params.fitnessLevel ? planData.params.fitnessLevel.substring(0,3).toUpperCase() : 'INT'}
                </Text>
              </View>
            </View>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabSegment, activeTab === 'workout' && styles.tabSegmentActive]}
              onPress={() => setActiveTab('workout')}
              activeOpacity={1}
            >
              <Ionicons 
                name="barbell" 
                size={18} 
                color={activeTab === 'workout' ? Colors.terraCotta : '#888'} 
              />
              <Text style={[styles.tabText, activeTab === 'workout' && styles.tabTextActive]}>Workouts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabSegment, activeTab === 'diet' && styles.tabSegmentActive]}
              onPress={() => setActiveTab('diet')}
              activeOpacity={1}
            >
              <Ionicons 
                name="restaurant" 
                size={18} 
                color={activeTab === 'diet' ? Colors.terraCotta : '#888'} 
              />
              <Text style={[styles.tabText, activeTab === 'diet' && styles.tabTextActive]}>Nutrition</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>
            {activeTab === 'workout' ? 'Weekly Routine' : 'Meal Plan'}
          </Text>

          <View style={styles.listContainer}>
            {formatPlanContent()}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={() => router.push('/(tabs)/workouts')}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.outlineButtonText}>Regenerate</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', // Pure Black
  },
  // This container restricts width on Web but allows full flex on Mobile
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600, // Prevents stretching on desktop
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // New Navigation Bar Styles
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 25 : 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Big Title Area
  titleSection: {
    marginBottom: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 34, // Larger, cleaner font
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },

  // Improved Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allows wrapping if screen is very narrow
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%', // On very small screens, this makes it 2x2. On wider, 1x4.
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row', // Horizontal layout inside the card
    alignItems: 'center',
    gap: 12,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Taller touch area
    borderRadius: 12,
    gap: 8,
  },
  tabSegmentActive: {
    backgroundColor: '#2C2C2E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginLeft: 4,
  },

  // Accordion Card
  listContainer: {
    gap: 16,
  },
  dayCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20, // Increased padding
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dayBadge: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayBadgeActive: {
    backgroundColor: Colors.terraCotta,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
  },
  dayBadgeTextActive: {
    color: '#FFF',
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contentBlock: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  bodyText: {
    fontSize: 16,
    color: '#CCC',
    lineHeight: 26,
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },

  actionRow: {
    marginTop: 30,
    alignItems: 'center',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#444',
    gap: 8,
  },
  outlineButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: 15,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noPlanTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noPlanText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});