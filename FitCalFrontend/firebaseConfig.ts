// FitzFrontend/firebaseConfig.ts - CORRECTED VERSION WITH ASYNCSTORAGE PERSISTENCE
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Should now resolve correctly
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5wj6es6Ac7z_hqgwEEFenGaoRgvbEoIY",
  authDomain: "calorie-app-c04e7.firebaseapp.com",
  projectId: "calorie-app-c04e7",
  storageBucket: "calorie-app-c04e7.firebasestorage.app",
  messagingSenderId: "699559097501",
  appId: "1:699559097501:web:3d0698373bf42dda9cd074",
  measurementId: "G-3MF8TM4C4R"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Cloud Firestore
export const db = getFirestore(app);

console.log('Firebase Client SDK Initialized with AsyncStorage Persistence!');