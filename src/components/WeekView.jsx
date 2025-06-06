// Week view component for displaying the calendar view.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState, useEffect } from "react";
import { useEvents } from "../context/EventsContext";
import ModifyEvent from "./ModifyEvent";

function WeekView({ selectedDate }) {
  const { getEventsForWeek, getEventsForDate } = useEvents();
  const [currentWeek, setCurrentWeek] = useState(selectedDate || new Date());
  const [weekEvents, setWeekEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    // Update current week if selectedDate changes
    if (selectedDate) {
      setCurrentWeek(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    // Get start of week (Sunday)
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Get events for the week
    const events = getEventsForWeek(startOfWeek);
    setWeekEvents(events);
  }, [currentWeek, getEventsForWeek]);

  const getWeekDays = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "narrow" });
    const day = date.toLocaleDateString("en-US", { day: "numeric" });
    return (
      <>
        {weekday}
        <br />
        {day}
      </>
    );
  };

  const formatDateRange = (date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const getEventsForDay = (date) => {
    return getEventsForDate(date).sort((a, b) => {
      const timeA = a.startTime || a.time;
      const timeB = b.startTime || b.time;
      return timeA.localeCompare(timeB);
    });
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const isCurrentDay = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasEvent = (date) => {
    return getEventsForDay(date).length > 0;
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModifyEvent = () => {
    setSelectedEvent(null);
  };

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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mx-10 mb-5">
        <button
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          onClick={handlePrevWeek}
        >
          &lt;
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {formatDateRange(currentWeek)}
        </h2>
        <button
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          onClick={handleNextWeek}
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-bold mb-2.5">
        {getWeekDays().map((day, index) => (
          <div key={index} className="text-center font-medium text-gray-600">
            {formatDate(day)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {getWeekDays().map((day, index) => (
          <div
            key={index}
            className={`
                flex-1 overflow-y-auto border border-gray-border relative cursor-pointer
                ${
                  isCurrentDay(day)
                    ? "text-white border border-primary-dark shadow-md"
                    : ""
                }
                ${
                  hasEvent(day)
                    ? 'after:content-["•"] after:text-primary after:absolute after:bottom-1 after:left-1 after:text-xl'
                    : ""
                }
              `}
          >
            {getEventsForDay(day).map((event, eventIndex) => (
              <div
                key={eventIndex}
                onClick={() => handleEventClick(event)}
                className="bg-primary bg-opacity-10 p-1 md:p-2 rounded-md m-1 md:m-2 border border-primary border-opacity-20 cursor-pointer hover:bg-primary hover:bg-opacity-20 transition-colors min-h-0"
              >
                <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    {getWeatherIcon(event) && (
                      <img
                        src={getWeatherIcon(event)}
                        alt="Weather icon"
                        className="w-4 h-4 md:w-6 md:h-6 flex-shrink-0"
                      />
                    )}
                    <span className="font-medium text-primary text-xs md:text-sm truncate min-w-0">
                      {event.title}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-gray-600 truncate">
                    {event.startTime
                      ? `${event.startTime} - ${event.endTime}`
                      : event.time}
                  </span>
                  {event.description && (
                    <span className="text-xs md:text-sm text-gray-500 line-clamp-1 md:line-clamp-2 break-words">
                      {event.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* ModifyEvent popup */}
      {selectedEvent && (
        <ModifyEvent
          event={selectedEvent}
          onClose={handleCloseModifyEvent}
        />
      )}
    </div>
  );
}

export default WeekView;
