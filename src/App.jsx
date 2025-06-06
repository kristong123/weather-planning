// Where the app is rendered with Firebase integration.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Title from "./components/Title";
import Calendar from "./components/Calendar";
import NewEventButton from "./components/NewEventButton";
import PlannedEvents from "./components/PlannedEvents";
import ViewDropdown from "./components/ViewDropdown";
import Footer from "./components/Footer";
import Login from "./components/Login";
import SignOutButton from "./components/SignOutButton";
import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { EventsProvider } from "./context/EventsContext";

function AppContent() {
  const [viewType, setViewType] = useState("week");
  const [selectedDate, setSelectedDate] = useState(null);
  const { user, loading } = useAuth();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Show loading spinner while checking authentication, but only for authenticated routes
  // Don't hide the login page during initial auth check
  if (loading && window.location.pathname !== '/login') {
    return <LoadingSpinner />;
  }

  // Main content layout for authenticated users
  const mainLayout = (
    <div className="w-screen h-screen flex flex-col">
      <Title />
      <ViewDropdown viewType={viewType} onViewChange={setViewType} />
      <SignOutButton />

      <div className="
        flex flex-col-reverse md:flex-row gap-5 flex-1 mx-2
        md:mx-10"
      >
        <div className="flex flex-col-reverse md:flex-col w-full md:w-60 gap-3">
          <NewEventButton />
          <PlannedEvents />
        </div>
        <Calendar 
          defaultView={viewType} 
          onViewChange={setViewType}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect} 
        />
      </div>

      <div className="mx-auto px-4 py-3">
        <Footer />
      </div>
    </div>
  );

  return (
      <Routes>
        <Route path="/login" element={<Login />} />
      <Route 
        path="/week" 
        element={
          <ProtectedRoute>
            {mainLayout}
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={
        user ? <Navigate to="/week" replace /> : <Navigate to="/login" replace />
      } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <EventsProvider>
        <AppContent />
    </EventsProvider>
    </AuthProvider>
  );
}

export default App;