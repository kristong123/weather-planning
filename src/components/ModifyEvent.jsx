// Pop-up page for users to modify events in their calendar.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState, useEffect, useRef } from "react";
import { useEvents } from "../context/EventsContext";
import Popup from "./Popup";
import Alert from "./Alert";
import { weatherService } from "../utils/weatherService";

function ModifyEvent({ event, onClose }) {
  const { removeEvent, updateEvent, addEvent } = useEvents();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  // Helper function to get current weather conditions from event
  const getCurrentWeatherConditions = () => {
    // For planned events, always use weatherPreferences (the current/updated preferences)
    if (event.status === 'planned' && event.weatherPreferences?.condition) {
      return Array.isArray(event.weatherPreferences.condition) 
        ? event.weatherPreferences.condition 
        : [event.weatherPreferences.condition];
    }
    
    // For scheduled events, prioritize weatherPreferences if available, otherwise use weatherInfo
    if (event.weatherPreferences?.condition) {
      return Array.isArray(event.weatherPreferences.condition) 
        ? event.weatherPreferences.condition 
        : [event.weatherPreferences.condition];
    }
    
    // Fallback to weatherInfo for legacy scheduled events
    if (event.weatherInfo?.condition) {
      return [event.weatherInfo.condition];
    }
    
    return [];
  };

  const [eventData, setEventData] = useState({
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    weatherConditions: getCurrentWeatherConditions(),
    startDate: event.weatherPreferences?.dateRange?.split(' to ')[0] || event.date || "",
    endDate: event.weatherPreferences?.dateRange?.split(' to ')[1] || event.date || "",
    startTime: event.weatherPreferences?.timeRange?.split(' - ')[0] || event.startTime || "",
    endTime: event.weatherPreferences?.timeRange?.split(' - ')[1] || event.endTime || ""
  });
  const [errors, setErrors] = useState({});
  const [locationSearch, setLocationSearch] = useState(event.location || "");
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const locationRef = useRef(null);
  const timeoutRef = useRef(null);

  // Update form data when event prop changes
  useEffect(() => {
    setEventData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      weatherConditions: getCurrentWeatherConditions(),
      startDate: event.weatherPreferences?.dateRange?.split(' to ')[0] || event.date || "",
      endDate: event.weatherPreferences?.dateRange?.split(' to ')[1] || event.date || "",
      startTime: event.weatherPreferences?.timeRange?.split(' - ')[0] || event.startTime || "",
      endTime: event.weatherPreferences?.timeRange?.split(' - ')[1] || event.endTime || ""
    });
    setLocationSearch(event.location || "");
  }, [event]);

  console.log('Event:', event);
  console.log('Event weather info:', event.weatherInfo);
  console.log('Event weather preferences:', event.weatherPreferences);
  console.log('Initial weather conditions:', eventData.weatherConditions);

  const weatherOptions = [
    { value: "sunny", label: "Sunny" },
    { value: "cloudy", label: "Cloudy" },
    { value: "rainy", label: "Rainy" },
    { value: "snowy", label: "Snowy" },
    { value: "foggy", label: "Foggy" },
    { value: "thunderstorm", label: "Thunderstorm" }
  ];

  // Helper function to get weather icon
  const getWeatherIcon = (event) => {
    // For manual events, don't show any weather icon
    if (event.type === 'manual') {
      return null;
    }
    
    // For scheduled events with actual weather info
    if (event.weatherInfo?.condition) {
      const condition = event.weatherInfo.condition.toLowerCase();
      switch (condition) {
        case 'sunny': return '/images/sunny.png';
        case 'cloudy': return '/images/cloudy.png';
        case 'rainy': return '/images/rain.png';
        case 'snowy': return '/images/snow.png';
        case 'foggy': return '/images/fog.png';
        case 'thunderstorm': return '/images/thunderstorm.png';
        case 'windy': return '/images/windy.png';
        default: return '/images/partlycloudy.png';
      }
    }
    
    // For planned events with weather preferences
    if (event.weatherPreferences?.condition) {
      const conditions = Array.isArray(event.weatherPreferences.condition) 
        ? event.weatherPreferences.condition 
        : [event.weatherPreferences.condition];
      
      // Show icon for first condition if multiple
      const condition = conditions[0].toLowerCase();
      switch (condition) {
        case 'sunny': return '/images/sunny.png';
        case 'cloudy': return '/images/cloudy.png';
        case 'rainy': return '/images/rain.png';
        case 'snowy': return '/images/snow.png';
        case 'foggy': return '/images/fog.png';
        case 'thunderstorm': return '/images/thunderstorm.png';
        case 'windy': return '/images/windy.png';
        default: return '/images/partlycloudy.png';
      }
    }
    
    return '/images/partlycloudy.png'; // Default fallback
  };

  // Handle click outside to close location dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce location search
  useEffect(() => {
    const searchLocations = async () => {
      if (locationSearch.length < 2) {
        setLocationResults([]);
        return;
      }

      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationSearch)}&count=5&language=en&format=json`);
        const data = await response.json();
        
        if (data.results) {
          setLocationResults(data.results.map(result => ({
            name: result.name.split(',')[0].trim(),
            state: result.admin1 || '',
            country: result.country,
            latitude: result.latitude,
            longitude: result.longitude
          })));
        } else {
          setLocationResults([]);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setLocationResults([]);
      }
    };

    const timeoutId = setTimeout(searchLocations, 300);
    return () => clearTimeout(timeoutId);
  }, [locationSearch]);

  const handleLocationSelect = (location) => {
    const locationString = location.state 
      ? `${location.name}, ${location.state}, ${location.country}`
      : `${location.name}, ${location.country}`;
    
    setEventData(prev => ({
      ...prev,
      location: locationString
    }));
    setLocationSearch(locationString);
    setShowLocationResults(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "location") {
      setLocationSearch(value);
      setShowLocationResults(true);
    }
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleDateBlur = (e) => {
    const { name, value } = e.target;
    if (!value) return;

    // Check if we have a complete date (YYYY-MM-DD)
    if (value.length === 10) {
      const selectedDate = new Date(value + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only prevent dates before today
      if (selectedDate < today) {
        setErrors(prev => ({
          ...prev,
          [name]: "Cannot select a date in the past"
        }));
        setEventData(prev => ({
          ...prev,
          [name]: ""
        }));
      } else {
        // Clear any existing errors for this field
        setErrors(prev => ({
          ...prev,
          [name]: ""
        }));

        // If this is an end date, check if it's after the start date
        if (name === "endDate" && eventData.startDate) {
          const startDate = new Date(eventData.startDate);
          if (selectedDate < startDate) {
            setErrors(prev => ({
              ...prev,
              [name]: "End date must be after start date"
            }));
            setEventData(prev => ({
              ...prev,
              [name]: ""
            }));
          }
        }
      }
    }
  };

  const handleTimeBlur = (e) => {
    const { name, value } = e.target;
    if (!value) return;

    const dateToCheck = name === "startTime" ? eventData.startDate : eventData.endDate;
    if (dateToCheck) {
      const selectedDateTime = new Date(`${dateToCheck}T${value}`);
      const now = new Date();

      // For today's date, only prevent times in the past
      if (dateToCheck === new Date().toISOString().split('T')[0] && selectedDateTime < now) {
        setErrors(prev => ({
          ...prev,
          [name]: "Cannot select a time in the past"
        }));
        setEventData(prev => ({
          ...prev,
          [name]: ""
        }));
      } else {
        // Clear any existing errors for this field
        setErrors(prev => ({
          ...prev,
          [name]: ""
        }));

        // If this is an end time, check if it's after the start time
        if (name === "endTime" && eventData.startTime && dateToCheck === eventData.startDate) {
          const startDateTime = new Date(`${dateToCheck}T${eventData.startTime}`);
          if (selectedDateTime <= startDateTime) {
            setErrors(prev => ({
              ...prev,
              [name]: "End time must be after start time"
            }));
            setEventData(prev => ({
              ...prev,
              [name]: ""
            }));
          }
        }
      }
    }
  };

  const handleWeatherChange = (weatherValue) => {
    setEventData((prev) => {
      const currentConditions = Array.isArray(prev.weatherConditions) ? prev.weatherConditions : [prev.weatherConditions];
      const isSelected = currentConditions.includes(weatherValue);
      
      const newConditions = isSelected
        ? currentConditions.filter(condition => condition !== weatherValue)
        : [...currentConditions, weatherValue];
      
      return {
        ...prev,
        weatherConditions: newConditions
      };
    });
  };

  // Add timeout for alerts
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        handleAlertClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const handleAlertClose = () => {
    // Only close the modal for success and info alerts
    if (alertMessage?.type === 'success' || alertMessage?.type === 'info') {
      onClose();
    }
    setAlertMessage(null);
  };

  const handleDelete = async () => {
    setAlertMessage({
      message: `Are you sure you want to delete "${event.title}"?`,
      type: 'warning',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          removeEvent(event.id);
          onClose(); // Close the modal immediately after successful deletion
        } catch (error) {
          console.error('Error deleting event:', error);
          setAlertMessage({
            message: 'Error deleting event. Please try again.',
            type: 'error'
          });
        } finally {
          setIsDeleting(false);
        }
      },
      onCancel: () => {
        setAlertMessage(null);
      }
    });
  };

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Check if there are any errors
    if (Object.values(errors).some(error => error !== "")) {
      return;
    }
    
    // Validate that at least one weather condition is selected for automatic events
    if (event.type === "automatic" && eventData.weatherConditions.length === 0) {
      setAlertMessage({
        message: "Please select at least one weather condition for automatic events.",
        type: 'warning'
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedEvent = {
        ...event,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location
      };

      if (event.type === "automatic") {
        updatedEvent.weatherPreferences = {
          condition: eventData.weatherConditions,
          dateRange: `${eventData.startDate} to ${eventData.endDate}`,
          timeRange: eventData.startTime && eventData.endTime ? `${eventData.startTime} - ${eventData.endTime}` : null
        };

        // Update the event first
        updateEvent(event.id, updatedEvent);

        // Then try to schedule it based on weather
        try {
          // Geocode the location
          const coordinates = await weatherService.geocodeLocation(updatedEvent.location);
          
          // Get weather forecast for the date range
          const [startDate, endDate] = updatedEvent.weatherPreferences.dateRange.split(' to ');
          const weatherData = await weatherService.getWeatherForecast(
            coordinates.latitude,
            coordinates.longitude,
            startDate,
            endDate
          );

          // Extract time preferences if they exist
          let startTime = null, endTime = null;
          if (updatedEvent.weatherPreferences.timeRange) {
            [startTime, endTime] = updatedEvent.weatherPreferences.timeRange.split(' - ');
          }

          // Find the best date for the event
          const bestDate = weatherService.findBestEventDate(
            weatherData,
            updatedEvent.weatherPreferences.condition,
            null,
            startTime,
            endTime
          );

          if (bestDate) {
            // Remove the planned event and add a scheduled one
            removeEvent(event.id);
            
            const scheduledEvent = {
              ...updatedEvent,
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
            
            addEvent(scheduledEvent);
            setAlertMessage({
              message: `${updatedEvent.title} has been scheduled for ${bestDate.date} from ${bestDate.startTime} to ${bestDate.endTime}!`,
              type: 'success'
            });
          } else {
            // No suitable weather found - convert to planned event
            const plannedEvent = {
              ...updatedEvent,
              status: "planned",
              weatherPreferences: {
                condition: eventData.weatherConditions,
                dateRange: `${eventData.startDate} to ${eventData.endDate}`,
                timeRange: eventData.startTime && eventData.endTime ? `${eventData.startTime} - ${eventData.endTime}` : null
              }
            };
            
            // Update the event to be planned
            updateEvent(event.id, plannedEvent);
            
            setAlertMessage({
              message: `No suitable weather found for "${updatedEvent.title}". Event has been moved to planned events and will be scheduled when weather conditions are met.`,
              type: 'info'
            });
          }
        } catch (error) {
          console.error('Error checking weather:', error);
          setAlertMessage({
            message: 'Error checking weather. Please try again.',
            type: 'error'
          });
        }
      } else {
        // For manual events, just update the event
        updatedEvent.date = eventData.startDate;
        updatedEvent.startTime = eventData.startTime;
        updatedEvent.endTime = eventData.endTime;
        updateEvent(event.id, updatedEvent);
        setAlertMessage({
          message: "Event updated successfully!",
          type: 'success'
        });
      }

      // Set timeout to close both alert and modal after 3 seconds
      timeoutRef.current = setTimeout(() => {
        if (alertMessage?.type !== 'error') {
          setAlertMessage(null);
          onClose();
        }
      }, 3000);
    } catch (error) {
      console.error('Error updating event:', error);
      setAlertMessage({
        message: 'Error updating event. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (event) => {
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    } else if (event.time) {
      return event.time;
    }
    return "Time not specified";
  };

  const formatDate = (event) => {
    if (event.date) {
      return new Date(event.date).toLocaleDateString();
    } else if (event.weatherPreferences?.dateRange) {
      return `Date range: ${event.weatherPreferences.dateRange}`;
    }
    return "Date not specified";
  };

  const formatWeatherConditions = (event) => {
    if (event.weatherInfo) {
      return `${event.weatherInfo.condition} weather, ${Math.round(event.weatherInfo.temperature)}°F`;
    } else if (event.weatherPreferences?.condition) {
      const conditions = Array.isArray(event.weatherPreferences.condition) 
        ? event.weatherPreferences.condition 
        : [event.weatherPreferences.condition];
      
      const conditionText = conditions.length > 1 
        ? `${conditions.slice(0, -1).join(', ')} or ${conditions.slice(-1)}` 
        : conditions[0];
      
      return `Preferred: ${conditionText} weather`;
    }
    return "No weather information";
  };

  return (
    <>
      <Popup
        isOpen={true}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            {getWeatherIcon(event) && (
              <img
                src={getWeatherIcon(event)}
                alt="Weather icon"
                className="w-6 h-6"
              />
            )}
            <span className="break-words max-w-[200px]">{event.title}</span>
          </div>
        }
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={eventData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {event.type === "automatic" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={eventData.startDate}
                    onChange={handleInputChange}
                    onBlur={handleDateBlur}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.startDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={eventData.endDate}
                    onChange={handleInputChange}
                    onBlur={handleDateBlur}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.endDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time (optional)
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={eventData.startTime}
                    onChange={handleInputChange}
                    onBlur={handleTimeBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.startTime ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time (optional)
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={eventData.endTime}
                    onChange={handleInputChange}
                    onBlur={handleTimeBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.endTime ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="weatherConditions" className="block text-sm font-medium text-gray-700 mb-1">
                  Weather Conditions (required)
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-x-4">
                    {weatherOptions.map((option) => (
                      <label 
                        key={option.value} 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={eventData.weatherConditions.includes(option.value)}
                          onChange={() => handleWeatherChange(option.value)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {eventData.weatherConditions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {eventData.weatherConditions.map((condition) => (
                      <span 
                        key={condition}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-white"
                      >
                        {weatherOptions.find(opt => opt.value === condition)?.label}
                        <button
                          type="button"
                          onClick={() => handleWeatherChange(condition)}
                          className="ml-1 hover:bg-primary-dark rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={eventData.startDate}
                  onChange={handleInputChange}
                  onBlur={handleDateBlur}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.startDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={eventData.startTime}
                  onChange={handleInputChange}
                  onBlur={handleTimeBlur}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.startTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
                )}
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={eventData.endTime}
                  onChange={handleInputChange}
                  onBlur={handleTimeBlur}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.endTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative" ref={locationRef}>
              <input
                type="text"
                id="location"
                name="location"
                value={locationSearch}
                onChange={handleInputChange}
                required={event.type === "automatic"}
                placeholder="Search for a location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {showLocationResults && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {locationResults.map((location, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      {location.state 
                        ? `${location.name}, ${location.state}, ${location.country}`
                        : `${location.name}, ${location.country}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </button>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </Popup>

      {alertMessage && (
        <Alert
          message={alertMessage.message}
          type={alertMessage.type}
          onClose={handleAlertClose}
          onConfirm={alertMessage.onConfirm}
          onCancel={alertMessage.onCancel}
          showConfirm={alertMessage.type === 'warning' && alertMessage.onConfirm}
        />
      )}
    </>
  );
}

export default ModifyEvent; 