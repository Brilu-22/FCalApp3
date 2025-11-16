// FitzFrontend/app/_layout.tsx
import React, { useEffect, useState, useContext } from 'react';
import { SplashScreen, Stack, useRouter, useSegments, Slot } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Colors } from '../constants/Colours';
import { ActivityIndicator, View } from 'react-native';
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

// Custom hook to provide user state
const AuthContext = React.createContext<AuthState | undefined>(undefined);

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

  // Check if user has an existing plan
  const checkForExistingPlan = async (userId: string) => {
    try {
      const storedPlan = await AsyncStorage.getItem('lastGeneratedDietPlan');
      // You could also check if the plan belongs to this user by storing userId with the plan
      setAuthState(prev => ({ ...prev, hasExistingPlan: !!storedPlan }));
      return !!storedPlan;
    } catch (error) {
      console.error('Error checking for existing plan:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const hasPlan = await checkForExistingPlan(firebaseUser.uid);
        
        setAuthState({ 
          user: firebaseUser,
          isLoading: false,
          displayName: firebaseUser.displayName ?? null,
          email: firebaseUser.email ?? null,
          photoURL: firebaseUser.photoURL ?? '',
          targetWeight: null, // You might want to fetch this from your backend
          currentWeight: null, // You might want to fetch this from your backend
          hasExistingPlan: hasPlan,
        });
      } else {
        // User is signed out
        setAuthState({
          user: null,
          isLoading: false,
          displayName: null,
          email: null,
          photoURL: '',
          targetWeight: null,
          currentWeight: null,
          hasExistingPlan: false,
        });
      }
      SplashScreen.hideAsync();
    });

    return () => unsubscribe();
  }, []);

  if (authState.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Define a temporary component to hold the conditional navigation
  const ConditionalRootNavigator = () => {
    const segments = useSegments();
    const router = useRouter();
    const { user, hasExistingPlan } = useUser(); // Get user and plan status from context

    useEffect(() => {
      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';
      const onWorkoutsScreen = segments[1] === 'workouts';
      const s1 = segments[1] as string | undefined;
      const onHomeScreen = s1 === 'home' || s1 === 'index';

      console.log('Auth State:', { 
        user: !!user, 
        hasExistingPlan, 
        segments, 
        inAuthGroup, 
        inTabsGroup,
        onWorkoutsScreen 
      });

      if (!user && !inAuthGroup) {
        // User is not logged in AND not currently in the /auth group, redirect to login
        console.log('Redirecting to login - no user');
        router.replace('/auth/login');
      } else if (user && !inTabsGroup && !inAuthGroup) {
        // User is logged in AND not currently in tabs or auth groups
        
        if (!hasExistingPlan) {
          // User has no existing plan - redirect to workouts to create one
          console.log('Redirecting to workouts - no existing plan');
          router.replace('/(tabs)/workouts' as any);
        } else {
          // User has an existing plan - redirect to home dashboard
          console.log('Redirecting to home - has existing plan');
          router.replace('/(tabs)/home' as any);
        }
      }
      // If user is logged in and in tabs, or not logged in and in auth, do nothing (stay put).
    }, [user, hasExistingPlan, segments, router]);

    return (
      <Stack screenOptions={{ headerShown: false }}>
        {/*
          The Slot will automatically render the correct route based on the URL.
        */}
        <Slot />
        {/* Other common screens like a modal could go here, accessible from both groups */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    );
  };

  return (
    <AuthContext.Provider value={authState}>
      <SafeAreaProvider>
        <ConditionalRootNavigator />
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}