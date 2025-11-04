// FITZ_FRONT/firebaseConfig.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your Firebase web app configuration (from Firebase Console Step 1)
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
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db: Firestore = getFirestore(app);

console.log('Firebase Client SDK Initialized!');


