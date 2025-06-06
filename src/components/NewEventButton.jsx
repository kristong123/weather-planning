// New event button component for users to create either weather-based or manual events.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState } from "react";
import NewEvent from "./NewEvent";

function NewEventButton() {
  const [showModal, setShowModal] = useState(false);
  
  const handleClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <button 
        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center" 
        onClick={handleClick}
      >
        <span>New Event</span>
        <img
          src="/images/plus.png"
          alt="White plus icon within the new event button"
          className="ml-2 w-[25px] h-[25px] filter brightness-0 invert"
        />
      </button>

      {showModal && (
        <NewEvent onClose={closeModal} />
      )}
    </>
  );
}

export default NewEventButton;
