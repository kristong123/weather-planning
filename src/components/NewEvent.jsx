// Pop-up page for users to create weather-based events.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState, useEffect, useRef } from "react";
import { useEvents } from "../context/EventsContext";
import { weatherService } from "../utils/weatherService";
import Popup from "./Popup";
import Alert from "./Alert";

function NewEvent({ onClose }) {
  const { addEvent } = useEvents();
  const [eventType, setEventType] = useState("automatic");
  const [isLoading, setIsLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const locationRef = useRef(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    startDate: "",
    endDate: "",
    time: "",
    startTime: "",
    endTime: "",
    location: "",
    weatherConditions: [],
  });
  const [errors, setErrors] = useState({});

  const weatherOptions = [
    { value: "sunny", label: "Sunny" },
    { value: "cloudy", label: "Cloudy" },
    { value: "rainy", label: "Rainy" },
    { value: "snowy", label: "Snowy" },
    { value: "foggy", label: "Foggy" },
    { value: "thunderstorm", label: "Thunderstorm" }
  ];

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
    if ((name === "date" || name === "startDate" || name === "endDate") && value) {
      const year = value.split("-")[0];
      if (year.length > 4) {
        return;
      }
    }
    if (name === "location") {
      setLocationSearch(value);
      setShowLocationResults(true);
    }
    setEventData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));
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
      const currentConditions = prev.weatherConditions;
      const isSelected = currentConditions.includes(weatherValue);
      
      return {
        ...prev,
        weatherConditions: isSelected
          ? currentConditions.filter(condition => condition !== weatherValue)
          : [...currentConditions, weatherValue]
      };
    });
  };

  const processAutomaticEvent = async (eventInfo) => {
    setIsLoading(true);
    
    try {
      // For automatic events, we need to geocode the location to get coordinates
      let coordinates;
      if (eventInfo.location) {
        // Try to geocode the location
        try {
          coordinates = await weatherService.geocodeLocation(eventInfo.location);
        } catch (geocodeError) {
          setAlertMessage({
            message: `Could not find location "${eventInfo.location}". Please check the spelling and try again.`,
            type: 'error'
          });
          setIsLoading(false);
          return;
        }
      } else {
        // Fallback to user's current location
        coordinates = await weatherService.getCurrentLocation();
      }
      
      try {
      // Get weather forecast for the date range
      const weatherData = await weatherService.getWeatherForecast(
        coordinates.latitude,
        coordinates.longitude,
        eventInfo.startDate,
        eventInfo.endDate
      );

      // Find the best date for the event
      const bestDate = weatherService.findBestEventDate(
        weatherData,
          eventInfo.weatherConditions,
        null, // No temperature preference
        eventInfo.startTime,
        eventInfo.endTime
      );

      if (bestDate) {
        // Schedule the event for the best date found
        const scheduledEvent = {
          ...eventInfo,
          date: bestDate.date,
          startTime: bestDate.startTime,
          endTime: bestDate.endTime,
          type: "automatic",
          status: "scheduled",
          weatherInfo: {
            condition: bestDate.weather,
            temperature: bestDate.temperature,
            confidence: bestDate.confidence
          }
        };
        
          const result = await addEvent(scheduledEvent);
        
          if (result.success) {
            setAlertMessage({
              message: `Event scheduled for ${bestDate.date} from ${bestDate.startTime} to ${bestDate.endTime} with ${bestDate.weather} weather in ${eventInfo.location}!`,
              type: 'success'
            });
          } else {
            setAlertMessage({
              message: 'Error saving event. Please try again.',
              type: 'error'
            });
          }
          
          // Wait for 3 seconds before closing the modal
          setTimeout(() => {
            onClose();
          }, 3000);
      } else {
        // No suitable weather found, add to planned events
          const plannedEvent = {
            ...eventInfo,
            type: "automatic",
            status: "planned",
            weatherPreferences: {
              condition: eventInfo.weatherConditions,
              dateRange: `${eventInfo.startDate} to ${eventInfo.endDate}`,
              timeRange: eventInfo.startTime && eventInfo.endTime ? `${eventInfo.startTime} - ${eventInfo.endTime}` : null
            }
          };
          
          const result = await addEvent(plannedEvent);
          
          if (result.success) {
            setAlertMessage({
              message: 'No suitable weather found in the date range. Event added to planned events for future scheduling.',
              type: 'info'
            });
          } else {
            setAlertMessage({
              message: 'Error saving event. Please try again.',
              type: 'error'
            });
          }
          
          // Wait for 3 seconds before closing the modal
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } catch (weatherError) {
        // If there's an error getting weather data (likely due to future date),
        // treat it as a planned event
        const plannedEvent = {
          ...eventInfo,
          type: "automatic",
          status: "planned",
          weatherPreferences: {
            condition: eventInfo.weatherConditions,
            dateRange: `${eventInfo.startDate} to ${eventInfo.endDate}`,
            timeRange: eventInfo.startTime && eventInfo.endTime ? `${eventInfo.startTime} - ${eventInfo.endTime}` : null
          }
        };
        
        const result = await addEvent(plannedEvent);
        
        if (result.success) {
          setAlertMessage({
            message: 'Weather forecast not available for this date range. Event added to planned events for future scheduling.',
            type: 'info'
          });
        } else {
          setAlertMessage({
            message: 'Error saving event. Please try again.',
            type: 'error'
          });
        }
        
        // Wait for 3 seconds before closing the modal
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing automatic event:', error);
      setAlertMessage({
        message: 'Error processing automatic event. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if there are any errors
    if (Object.values(errors).some(error => error !== "")) {
      return;
    }
    
    // Validate that at least one weather condition is selected for automatic events
    if (eventType === "automatic" && eventData.weatherConditions.length === 0) {
      setAlertMessage({
        message: "Please select at least one weather condition for automatic events.",
        type: 'warning'
      });
      return;
    }

    // Validate required fields for manual events
    if (eventType === "manual") {
      if (!eventData.startTime || !eventData.endTime) {
        setAlertMessage({
          message: "Please provide both start and end time for manual events.",
          type: 'warning'
        });
        return;
      }
    }
    
    if (eventType === "automatic") {
      await processAutomaticEvent(eventData);
    } else {
      // Manual event - direct scheduling
      const manualEvent = {
        ...eventData,
        type: "manual",
        status: "scheduled"
      };
      
      const result = await addEvent(manualEvent);
      
      if (result.success) {
        setAlertMessage({
          message: "Event has been scheduled successfully!",
          type: 'success'
        });
      } else {
        setAlertMessage({
          message: 'Error saving event. Please try again.',
          type: 'error'
        });
      }
      
      // Wait for 3 seconds before closing the modal
      setTimeout(() => {
        onClose();
      }, 3000);
    }
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

  return (
    <>
      <Popup
        isOpen={true}
        onClose={onClose}
        title="New Event"
      >
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              eventType === "automatic"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setEventType("automatic")}
          >
            Automatic
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              eventType === "manual"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setEventType("manual")}
          >
            Manual
          </button>
        </div>

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

          {eventType === "automatic" ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={eventData.date}
                  onChange={handleInputChange}
                  onBlur={handleDateBlur}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date}</p>
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

          {eventType === "automatic" && (
            <>
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
                <label htmlFor="weatherConditions" className={`block text-sm font-medium text-gray-700 mb-1 ${eventType === "automatic" ? "after:content-['*'] after:text-red-500" : ""}`}>
                  Weather Conditions {eventType === "automatic" ? "(required)" : "(optional)"}
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
              </div>
            </>
          )}

          <div>
            <label htmlFor="location" className={`block text-sm font-medium text-gray-700 mb-1 ${eventType === "automatic" ? "after:content-['*'] after:text-red-500" : ""}`}>
              Location {eventType === "automatic" ? "(required)" : "(optional)"}
            </label>
            <div className="relative" ref={locationRef}>
            <input
              type="text"
              id="location"
              name="location"
                value={locationSearch}
              onChange={handleInputChange}
              required={eventType === "automatic"}
                placeholder={eventType === "automatic" ? "Search for a location..." : ""}
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

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Save Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </Popup>
      
      {alertMessage && (
        <Alert
          message={alertMessage.message}
          type={alertMessage.type}
          onClose={handleAlertClose}
        />
      )}
    </>
  );
}

export default NewEvent; 