// FitzFrontend/app/_layout.tsx
import React, { useEffect, useState, useContext } from 'react';
import { SplashScreen, Stack, useRouter, useSegments, Slot } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Colors } from '../constants/Colours';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// Define the shape of our authentication state
interface AuthState {
  targetWeight: number | null; // Assuming number, use 'any' if unsure
  currentWeight: number | null; // Assuming number, use 'any' if unsure
  displayName: string | null;
  email: string | null;
  photoURL: string;
  user: User | null;
  isLoading: boolean; // Indicates if the initial auth check is still in progress
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
    targetWeight: null, // Initialized
    currentWeight: null, // Initialized
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthState((prevState) => ({ // Use functional update to ensure latest state
        ...prevState, // Keep existing targetWeight and currentWeight unless updated here
        user: firebaseUser,
        isLoading: false,
        displayName: firebaseUser?.displayName ?? null,
        email: firebaseUser?.email ?? null,
        photoURL: firebaseUser?.photoURL ?? '',
        // If targetWeight/currentWeight should be reset or fetched with user,
        // you'd do it here. For now, they persist or stay null if not set.
      }));
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
    const { user } = useUser(); // Get user from context

    useEffect(() => {
      const inAuthGroup = String(segments[0]) === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';

      if (!user && !inAuthGroup) {
        // User is not logged in AND not currently in the /auth group, redirect to login
        router.replace('./auth/login');
      } else if (user && !inTabsGroup) {
        // User is logged in AND not currently in the /(tabs) group, redirect to home
        router.replace('/(tabs)');
      }
      // If user is logged in and in tabs, or not logged in and in auth, do nothing (stay put).
    }, [user, segments, router]);

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