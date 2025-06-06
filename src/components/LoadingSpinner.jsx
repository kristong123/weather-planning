// Loading spinner component for authentication and data loading states
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React from 'react';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
}

export default LoadingSpinner; 