// Events context for the app with Firebase integration.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { databaseService } from '../services/databaseService';

const EventsContext = createContext();

// Helper function to create a local date from a date string
const createLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Set up real-time listener for user events
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = databaseService.subscribeToUserEvents(user.uid, (userEvents) => {
      setEvents(userEvents);
      setLoading(false);
    });

    // Cleanup subscription on unmount or user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const addEvent = async (eventData) => {
    if (!user) {
      setError('User must be authenticated to add events');
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await databaseService.addEvent(user.uid, eventData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  const updateEvent = async (eventId, updateData) => {
    if (!user) {
      setError('User must be authenticated to update events');
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await databaseService.updateEvent(user.uid, eventId, updateData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  const removeEvent = async (eventId) => {
    if (!user) {
      setError('User must be authenticated to remove events');
      return { success: false, error: 'User not authenticated' };
    }

    if (!eventId) {
      throw new Error('Event ID is required for removal');
    }

    setLoading(true);
    setError(null);

    const result = await databaseService.removeEvent(user.uid, eventId);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = createLocalDate(event.date);
      return eventDate.toDateString() === date.toDateString() && event.status === "scheduled";
    });
  };

  const getEventsForWeek = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return events.filter(event => {
      const eventDate = createLocalDate(event.date);
      return eventDate >= startDate && eventDate <= endDate && event.status === "scheduled";
    });
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <EventsContext.Provider value={{ 
      events, 
      loading,
      error,
      addEvent, 
      removeEvent,
      updateEvent,
      getEventsForDate, 
      getEventsForWeek,
      clearError
    }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
} 