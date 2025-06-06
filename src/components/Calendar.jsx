// Calendar component for displaying the calendar view.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React from "react";
import WeekView from "./WeekView";
import MonthView from "./MonthView";

function Calendar({ defaultView = "week", onViewChange, selectedDate, onDateSelect }) {
  return (
    <div className="
      flex-1 min-h-[30rem] p-2 pt-5 rounded-lg shadow-sm border border-gray-200
      sm:p-8 sm:pt-5
    ">
      {defaultView === "week" ? (
        <WeekView selectedDate={selectedDate} />
      ) : (
        <MonthView onViewChange={onViewChange} onDateSelect={onDateSelect} />
      )}
    </div>
  );
}

export default Calendar;
