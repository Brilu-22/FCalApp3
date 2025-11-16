import React, { useEffect, useState, useContext, createContext } from 'react'; // Added createContext for explicit import
import { SplashScreen, Stack, useRouter, useSegments, Slot } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Ensure this uses persistence as per fix above
import { Colors } from '../constants/Colours';
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // Added StyleSheet
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

interface AuthState {
  targetWeight: number | null;
  currentWeight: number | null;
  displayName: string | null;
  email: string | null;
  photoURL: string;
  user: User | null;
  isLoading: boolean;
  hasExistingPlan: boolean;
}

// Define initial context value with undefined, but the hook will throw an error if not provided
const AuthContext = createContext<AuthState | undefined>(undefined);

export const useUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthContext.Provider');
  }
  return context;
};

export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    displayName: null,
    email: null,
    photoURL: '',
    targetWeight: null,
    currentWeight: null,
    hasExistingPlan: false,
  });

  const checkForExistingPlan = async (userId: string) => {
    try {
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      const hasPlan = !!storedPlan; // Convert to boolean
      console.log('🔍 Plan check for user', userId, 'has plan:', hasPlan);
      return hasPlan;
    } catch (error) {
      console.error('Error checking for existing plan:', error);
      // Decide how to handle this error. Returning false might be safe default.
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase Auth State Changed:', firebaseUser ? `User ${firebaseUser.uid} logged in` : 'User logged out');

      if (firebaseUser) {
        // Fetch additional user data or plan status here if needed from Firestore/Realtime DB
        // For now, only checking AsyncStorage for the plan
        const hasPlan = await checkForExistingPlan(firebaseUser.uid);

        console.log('🎯 Setting auth state: user logged in, has plan:', hasPlan);

        setAuthState({
          user: firebaseUser,
          isLoading: false,
          displayName: firebaseUser.displayName ?? null,
          email: firebaseUser.email ?? null,
          photoURL: firebaseUser.photoURL ?? '',
          targetWeight: null, // Populate these from user profile data if available
          currentWeight: null, // Populate these from user profile data if available
          hasExistingPlan: hasPlan,
        });
      } else {
        console.log('🎯 Setting auth state: no user');
        setAuthState({
          user: null,
          isLoading: false,
          displayName: null,
          email: null,
          photoURL: '',
          targetWeight: null,
          currentWeight: null,
          hasExistingPlan: false, // No user, no existing plan
        });
      }
      SplashScreen.hideAsync(); // Hide splash screen once auth state is determined
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []); // Empty dependency array means this runs once on mount

  if (authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const RootLayoutNav = () => {
    const segments = useSegments();
    const router = useRouter();
    const { user, hasExistingPlan } = authState; // Destructure directly from authState

    useEffect(() => {
      const inAuthGroup = segments[0] === '(auth)';
      // const inTabsGroup = segments[0] === '(tabs)'; // Not strictly needed for the current logic
      // const currentTab = segments[1]; // Not strictly needed for the current logic

      console.log('🔄 Routing Check:', {
        user: !!user,
        hasExistingPlan,
        inAuthGroup,
        segments: segments.join('/')
      });

      if (!user) {
        // User not signed in - redirect to login if not already there
        if (!inAuthGroup) {
          console.log('🚀 Redirecting to login - no user');
          router.replace('/(auth)/login');
        }
      } else {
        // User IS signed in
        if (inAuthGroup) {
          // User signed in but on an auth page - redirect based on plan status
          if (hasExistingPlan) {
            console.log('🚀 Redirecting to home - user has existing plan');
            router.replace('/(tabs)/home');
          } else {
            console.log('🚀 Redirecting to workouts - user needs to create plan');
            router.replace('/(tabs)/workouts');
          }
        }
        // If user is already in the (tabs) group, we do nothing and let them navigate freely within tabs.
        // This implicitly allows access to other tabs like '/(tabs)/workouts' if they came from '/(auth)'.
      }
    }, [user, hasExistingPlan, segments]); // Removed `router` as a dependency; it's stable.

    return (
      // Stack navigator for handling screen transitions
      <Stack screenOptions={{ headerShown: false }}>
        <Slot /> {/* This renders the current route */}
      </Stack>
    );
  };

  return (
    // Provide the auth state to the entire app
    <AuthContext.Provider value={authState}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});