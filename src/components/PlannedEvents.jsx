// Planned events component for displaying automatic events that could not be scheduled.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState } from "react";
import { useEvents } from "../context/EventsContext";
import { weatherService } from "../utils/weatherService";
import ModifyEvent from "./ModifyEvent";
import Alert from "./Alert";

// Helper function to create a local date from a date string
const createLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

function PlannedEvents() {
  const { events, addEvent, removeEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Only show planned automatic events
  const plannedEvents = events.filter(event => 
    event.type === "automatic" && event.status === "planned"
  );

  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  };

  const formatPlannedEventPreferences = (event) => {
    if (event.weatherPreferences) {
      let timeInfo = "";
      if (event.weatherPreferences.timeRange) {
        const [startTime, endTime] = event.weatherPreferences.timeRange.split(' - ');
        timeInfo = ` at ${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
      }
      
      const [startDate, endDate] = event.weatherPreferences.dateRange.split(' to ');
      const dateRange = `${formatDateShort(startDate)} to ${formatDateShort(endDate)}`;
      
      // Handle both single condition (string) and multiple conditions (array)
      const conditions = Array.isArray(event.weatherPreferences.condition) 
        ? event.weatherPreferences.condition 
        : [event.weatherPreferences.condition];
      
      const conditionText = conditions.length > 1 
        ? `${conditions.slice(0, -1).join(', ')} or ${conditions.slice(-1)}` 
        : conditions[0];
      
      return `${conditionText} weather${timeInfo}, ${dateRange}`;
    }
    return "Weather preferences not specified";
  };

  const recheckEventWeather = async (event) => {
    try {
      // Geocode the location
      const coordinates = await weatherService.geocodeLocation(event.location);
      
      // Get weather forecast for the date range
      const [startDate, endDate] = event.weatherPreferences.dateRange.split(' to ');
      const weatherData = await weatherService.getWeatherForecast(
        coordinates.latitude,
        coordinates.longitude,
        startDate,
        endDate
      );

      // Extract time preferences if they exist
      let startTime = null, endTime = null;
      if (event.weatherPreferences.timeRange) {
        [startTime, endTime] = event.weatherPreferences.timeRange.split(' - ');
      }

      // Find the best date for the event
      const bestDate = weatherService.findBestEventDate(
        weatherData,
        event.weatherPreferences.condition,
        null,
        startTime,
        endTime
      );

      if (bestDate) {
        // Remove the planned event and add a scheduled one
        const removeResult = await removeEvent(event.id);
        
        if (removeResult.success) {
        const scheduledEvent = {
          ...event,
          date: bestDate.date,
          startTime: bestDate.startTime,
          endTime: bestDate.endTime,
          status: "scheduled",
          weatherInfo: {
            condition: bestDate.weather,
            temperature: bestDate.temperature,
            confidence: bestDate.confidence
          }
        };
        
          const addResult = await addEvent(scheduledEvent);
          
          if (addResult.success) {
            setAlertMessage({
              message: `${event.title} has been scheduled for ${bestDate.date} from ${bestDate.startTime} to ${bestDate.endTime}!`,
              type: 'success'
            });
          } else {
            setAlertMessage({
              message: 'Error scheduling event. Please try again.',
              type: 'error'
            });
          }
        } else {
          setAlertMessage({
            message: 'Error updating event. Please try again.',
            type: 'error'
          });
        }
      } else {
        setAlertMessage({
          message: `Still no suitable weather found for "${event.title}". Will keep checking.`,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error rechecking weather:', error);
      setAlertMessage({
        message: `Still no suitable weather found for "${event.title}". Will keep checking.`,
        type: 'info'
      });
    }
  };

  const recheckAllEvents = async () => {
    if (plannedEvents.length === 0) {
      setAlertMessage({
        message: 'No planned events to recheck.',
        type: 'info'
      });
      return;
    }

    let scheduledCount = 0;
    const totalEvents = plannedEvents.length;
    
    // Create a copy of planned events since the array will change as we process
    const eventsToCheck = [...plannedEvents];
    
    for (const event of eventsToCheck) {
      try {
        // Geocode the location
        const coordinates = await weatherService.geocodeLocation(event.location);
        
        // Get weather forecast for the date range
        const [startDate, endDate] = event.weatherPreferences.dateRange.split(' to ');
        const weatherData = await weatherService.getWeatherForecast(
          coordinates.latitude,
          coordinates.longitude,
          startDate,
          endDate
        );

        // Extract time preferences if they exist
        let startTime = null, endTime = null;
        if (event.weatherPreferences.timeRange) {
          [startTime, endTime] = event.weatherPreferences.timeRange.split(' - ');
        }

        // Find the best date for the event
        const bestDate = weatherService.findBestEventDate(
          weatherData,
          event.weatherPreferences.condition,
          null,
          startTime,
          endTime
        );

        if (bestDate) {
          // Remove the planned event and add a scheduled one
          const removeResult = await removeEvent(event.id);
          
          if (removeResult.success) {
          const scheduledEvent = {
            ...event,
            date: bestDate.date,
            startTime: bestDate.startTime,
            endTime: bestDate.endTime,
            status: "scheduled",
            weatherInfo: {
              condition: bestDate.weather,
              temperature: bestDate.temperature,
              confidence: bestDate.confidence
            }
          };
          
            const addResult = await addEvent(scheduledEvent);
            
            if (addResult.success) {
          scheduledCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Error rechecking ${event.title}:`, error);
      }
    }
    
    if (scheduledCount > 0) {
      setAlertMessage({
        message: `Successfully scheduled ${scheduledCount} out of ${totalEvents} events!`,
        type: 'success'
      });
    } else {
      setAlertMessage({
        message: 'No events could be scheduled at this time. Weather conditions may not be suitable yet.',
        type: 'info'
      });
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModifyEvent = () => {
    setSelectedEvent(null);
  };

  const handleAlertClose = () => {
    setAlertMessage(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h5 className="text-lg font-medium text-gray-900 mb-0">Events</h5>
        {plannedEvents.length > 0 && (
          <button
            onClick={recheckAllEvents}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Re-check All
          </button>
        )}
      </div>
      <div className="p-4 max-h-[38rem] overflow-y-auto">

        {/* Planned Events (with re-check buttons) */}
        {plannedEvents.length > 0 ? (
            <div className="space-y-3">
              {plannedEvents.map(event => (
                <div 
                  key={event.id}
                onClick={() => handleEventClick(event)}
                className="bg-orange-50 p-3 rounded-md border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                >
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-orange-800 truncate">{event.title}</span>
                      <span className="text-sm text-orange-600">
                        {formatPlannedEventPreferences(event)}
                      </span>
                      {event.description && (
                        <span className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {event.description}
                        </span>
                      )}
                    </div>
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      recheckEventWeather(event);
                    }}
                    className="px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded hover:bg-orange-300 transition-colors flex-shrink-0"
                    >
                      Re-check
                    </button>
                  </div>
                </div>
              ))}
            </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <img 
                src="/images/calendar.png"
                alt="Calendar icon"
                className="w-12 h-12 mx-auto opacity-50"
              />
            </div>
            <p className="text-gray-500 text-sm">No planned events yet</p>
            <p className="text-gray-400 text-xs mt-1">Create an automatic event to get weather-based scheduling</p>
          </div>
        )}
      </div>

      {/* ModifyEvent popup */}
      {selectedEvent && (
        <ModifyEvent
          event={selectedEvent}
          onClose={handleCloseModifyEvent}
        />
      )}

      {/* Alert popup */}
      {alertMessage && (
        <Alert
          message={alertMessage.message}
          type={alertMessage.type}
          onClose={handleAlertClose}
        />
      )}
    </div>
  );
}

export default PlannedEvents;