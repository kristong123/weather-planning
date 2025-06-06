// Month view component for displaying the calendar view.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState } from "react";
import Calendar from "react-calendar";
import { useEvents } from "../context/EventsContext";
import ModifyEvent from "./ModifyEvent";

function MonthView({ onViewChange, onDateSelect }) {
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { getEventsForDate } = useEvents();

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleDateClick = (clickedDate) => {
    // Navigate to week view with the clicked date
    if (onViewChange && onDateSelect) {
      onDateSelect(clickedDate);
      onViewChange("week");
    }
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation(); // Prevent day click when clicking event
    setSelectedEvent(event);
  };

  const handleCloseModifyEvent = () => {
    setSelectedEvent(null);
  };

  const tileContent = ({ date }) => {
    const events = getEventsForDate(date);
    if (events.length > 0) {
      return (
        <div className="absolute bottom-1 left-1 right-1">
          <div className="flex flex-wrap gap-1 justify-center">
            {events.slice(0, 3).map((event, index) => (
              <div
                key={index}
                onClick={(e) => handleEventClick(event, e)}
                className="w-2 h-2 bg-primary rounded-full cursor-pointer hover:bg-primary-dark transition-colors"
                title={`${event.title}${event.startTime ? ` at ${event.startTime}` : event.time ? ` at ${event.time}` : ''}`}
              />
            ))}
            {events.length > 3 && (
              <div className="text-xs text-primary font-bold">
                +{events.length - 3}
              </div>
            )}
          </div>
          {events.length > 0 && (
            <div className="text-center mt-1">
              <div className="text-xs text-primary font-medium">
                {events.length} event{events.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Calendar
        onChange={handleDateChange}
        value={date}
        onClickDay={handleDateClick}
        className="h-full w-full border-0"
        tileClassName={({ date }) => {
          const events = getEventsForDate(date);
          const today = date.toDateString() === new Date().toDateString();
          return `!m-1 rounded hover:bg-gray-50 shadow-sm cursor-pointer relative ${
            events.length > 0 ? "has-events" : ""
          } ${
            today ? "border-2 border-primary-dark shadow-md bg-primary bg-opacity-10" : ""
          }`;
        }}
        tileContent={tileContent}
        navigationLabel={({ date }) => (
          <span className="text-xl font-semibold text-gray-800 m-auto">
            {date.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
        )}
        prevLabel={
          <span className="text-gray-600 hover:text-gray-900 mx-5">&lt;</span>
        }
        nextLabel={
          <span className="text-gray-600 hover:text-gray-900 mx-5">&gt;</span>
        }
        prev2Label={
          <span className="text-gray-600 hover:text-gray-900">&lt;&lt;</span>
        }
        next2Label={
          <span className="text-gray-600 hover:text-gray-900">&gt;&gt;</span>
        }
      />
      
      {/* ModifyEvent popup */}
      {selectedEvent && (
        <ModifyEvent
          event={selectedEvent}
          onClose={handleCloseModifyEvent}
        />
      )}
    </>
  );
}

export default MonthView;
