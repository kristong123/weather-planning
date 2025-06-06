// Firebase configuration and initialization
// Created by: Kris Tong, Ethan Chen, Emily Kim

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration object
// TODO: Replace these values with your actual Firebase config from the Firebase Console
// Go to Project Settings > General > Your apps > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "AIzaSyDu65WNUOHMcOeZZX-ObP4NlhcIswY3np0",
  authDomain: "weather-planner-c28aa.firebaseapp.com",
  databaseURL: "https://weather-planner-c28aa-default-rtdb.firebaseio.com",
  projectId: "weather-planner-c28aa",
  storageBucket: "weather-planner-c28aa.firebasestorage.app",
  messagingSenderId: "527263540871",
  appId: "1:527263540871:web:452921c846bc8203e67a22",
  measurementId: "G-66EY707HWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app; 