// Alert component for displaying the alert messages.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React from 'react';

function Alert({ message, type = 'info', onClose, onConfirm, onCancel, showConfirm = false }) {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  }[type];

  const buttonColor = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700'
  }[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${bgColor} border rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
        <p className={`${textColor} text-center break-words whitespace-pre-wrap`}>{message}</p>
        <div className="mt-4 flex justify-center gap-3">
          {showConfirm ? (
            <>
              <button
                onClick={onCancel || onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 ${buttonColor} text-white rounded-md transition-colors`}
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`px-4 py-2 ${buttonColor} text-white rounded-md transition-colors`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alert; 