// Pop-up page for users to manually input events in their calendar.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState } from "react";
import { useEvents } from "../context/EventsContext";
import { useNavigate } from "react-router-dom";

function ManualEvent({ onClose, onSwitchType }) {
  const { addEvent } = useEvents();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: ""
  });

  const handleAutomaticClick = () => {
    onSwitchType("automatic");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create event object
    const event = {
      title: formData.title,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      description: formData.description,
      type: "manual"
    };

    // Add event to context
    addEvent(event);

    // Close modal and navigate back to calendar
    onClose();
    navigate("/week");
  };

  return (
    <div className="eventPopup popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h2>Create Manual Event</h2>
          <button
            className="closePopup close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <button 
          className="automatic-button"
          onClick={handleAutomaticClick}
        >
          Automatic
        </button>
        <button className="manual-button">Manual</button>
        <div className="popup-body">
          <form className="eventForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Event Name</label>
              <input 
                type="text" 
                id="title"
                name="title"
                className="eventName"
                value={formData.title}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input 
                type="date"
                id="date"
                name="date"
                className="eventDate"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input 
                type="time" 
                id="startTime"
                name="startTime"
                className="eventTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input 
                type="time" 
                id="endTime"
                name="endTime"
                className="eventTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input 
                type="text" 
                id="location"
                name="location"
                className="eventLocation"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="eventDescription"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancelEvent cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="saveEvent save-button">
                Save Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ManualEvent; 