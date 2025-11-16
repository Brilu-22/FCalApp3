// FitzFrontend/firebaseConfig.ts - SIMPLE WORKING VERSION
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication (SIMPLE - no persistence)
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

console.log('Firebase Client SDK Initialized!');