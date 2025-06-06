// Popup component for displaying the pop-up pages.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React from "react";

function Popup({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-2xl",
  maxHeight = "max-h-[90vh]" 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-lg w-full ${maxWidth} mx-4 p-6 ${maxHeight} overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button 
            className="text-2xl text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Popup; 