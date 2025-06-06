// View dropdown component for users to switch between week and month views.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React from "react";

function ViewDropdown({ viewType, onViewChange }) {
  return (
    <select
      value={viewType}
      onChange={(e) => onViewChange(e.target.value)}
      className="
        absolute w-[30vw] h-12 top-[4.75rem] left-[18%] text-[4vw] bg-white border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        md:w-32 md:h-12 md:top-[2rem] md:right-10 md:left-auto md:text-base
      "
    >
      <option value="week">Week View</option>
      <option value="month">Month View</option>
    </select>
  );
}

export default ViewDropdown;
