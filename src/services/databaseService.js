// Database service for Firebase Realtime Database
// Created by: Kris Tong, Ethan Chen, Emily Kim

import { 
  ref, 
  push, 
  set, 
  get, 
  remove, 
  onValue, 
  off,
  update
} from 'firebase/database';
import { database } from '../config/firebase';

export const databaseService = {
  // Add new event to user's events
  addEvent: async (userId, eventData) => {
    try {
      const eventsRef = ref(database, `users/${userId}/events`);
      const newEventRef = push(eventsRef);
      const eventWithId = {
        ...eventData,
        id: newEventRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await set(newEventRef, eventWithId);
      return { success: true, eventId: newEventRef.key };
    } catch (error) {
      console.error('Error adding event:', error);
      return { success: false, error: error.message };
    }
  },

  // Update existing event
  updateEvent: async (userId, eventId, updateData) => {
    try {
      const eventRef = ref(database, `users/${userId}/events/${eventId}`);
      const updatedData = {
        ...updateData,
        updatedAt: Date.now()
      };
      
      await update(eventRef, updatedData);
      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove event
  removeEvent: async (userId, eventId) => {
    try {
      const eventRef = ref(database, `users/${userId}/events/${eventId}`);
      await remove(eventRef);
      return { success: true };
    } catch (error) {
      console.error('Error removing event:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all events for a user (one-time read)
  getUserEvents: async (userId) => {
    try {
      const eventsRef = ref(database, `users/${userId}/events`);
      const snapshot = await get(eventsRef);
      
      if (snapshot.exists()) {
        const eventsData = snapshot.val();
        // Convert object to array and ensure each event has an id
        const eventsArray = Object.keys(eventsData).map(key => ({
          ...eventsData[key],
          id: key
        }));
        return { success: true, events: eventsArray };
      } else {
        return { success: true, events: [] };
      }
    } catch (error) {
      console.error('Error getting user events:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to real-time updates for user events
  subscribeToUserEvents: (userId, callback) => {
    const eventsRef = ref(database, `users/${userId}/events`);
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const eventsData = snapshot.val();
        // Convert object to array and ensure each event has an id
        const eventsArray = Object.keys(eventsData).map(key => ({
          ...eventsData[key],
          id: key
        }));
        callback(eventsArray);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Error in real-time listener:', error);
      callback([]);
    });

    return unsubscribe;
  },

  // Save user profile data
  saveUserProfile: async (userId, profileData) => {
    try {
      const userRef = ref(database, `users/${userId}/profile`);
      const profile = {
        ...profileData,
        updatedAt: Date.now()
      };
      
      await set(userRef, profile);
      return { success: true };
    } catch (error) {
      console.error('Error saving user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user profile data
  getUserProfile: async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}/profile`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return { success: true, profile: snapshot.val() };
      } else {
        return { success: true, profile: null };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }
}; 