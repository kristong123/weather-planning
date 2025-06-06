// Login component for users to log in to their account with Firebase Auth.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { user, signIn, signUp, error, loading, clearError } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/week");
    }
  }, [user, navigate]);

  // Clear errors when switching between sign in/up
  useEffect(() => {
    setLocalError("");
    setFieldErrors({});
    clearError();
  }, [isSignUp]); // Removed clearError from dependency array

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setFieldErrors({});
    clearError(); // Clear any previous errors from AuthContext
    
    // Validate form fields
    const errors = {};
    if (!username.trim()) {
      errors.username = "Username is required";
    }
    if (!password.trim()) {
      errors.password = "Password is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    // Generate fake email for Firebase Auth
    const email = `${username.toLowerCase().trim()}@weatherapp.local`;

    try {
      if (isSignUp) {
        // Additional validation for sign up
        const signUpErrors = {};
        
        if (username.length < 3) {
          signUpErrors.username = "Username must be at least 3 characters";
        }
        
        if (password.length < 6) {
          signUpErrors.password = "Password must be at least 6 characters";
        }
        
        if (password !== confirmPassword) {
          signUpErrors.confirmPassword = "Passwords do not match";
        }
        
        if (Object.keys(signUpErrors).length > 0) {
          setFieldErrors(signUpErrors);
          return;
        }

        const result = await signUp(email, password, username);
        
        if (result.success) {
          navigate("/week");
        } else {
          // Handle specific Firebase auth errors for sign up
          let errorHandled = false;
          
          if (result.error && result.error.includes('auth/email-already-in-use')) {
            setFieldErrors({ username: "This username is already taken. Please choose a different username." });
            errorHandled = true;
          } else if (result.error && result.error.includes('auth/weak-password')) {
            setFieldErrors({ password: "Password is too weak. Please choose a stronger password." });
            errorHandled = true;
          } else if (result.error && result.error.includes('auth/invalid-email')) {
            setFieldErrors({ username: "Invalid username format. Please try again." });
            errorHandled = true;
          }
          
          if (!errorHandled) {
            // Show the raw error for debugging
            setLocalError(`Failed to create account: ${result.error}`);
          }
          
          return; // Prevent any further execution
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          navigate("/week");
        } else {
          console.log('Sign in error:', result.error); // Debug log
          
          // Handle specific Firebase auth errors for sign in
          if (result.error && (
            result.error.includes('auth/invalid-credential') || 
            result.error.includes('auth/invalid-login-credentials') ||
            result.error.includes('auth/user-not-found') ||
            result.error.includes('auth/wrong-password')
          )) {
            setFieldErrors({ 
              username: "Invalid username or password", 
              password: "Please check your credentials and try again" 
            });
          } else if (result.error && result.error.includes('auth/too-many-requests')) {
            setLocalError("Too many failed attempts. Please try again later.");
          } else if (result.error && result.error.includes('auth/user-disabled')) {
            setLocalError("This account has been disabled. Please contact support.");
          } else {
            // Show the actual error message for debugging
            setLocalError(result.error || "Invalid username or password. Please try again.");
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error); // Debug log
      setLocalError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    // <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 md:px-6 lg:px-8"></div>
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 md:px-6 lg:px-8">
      <div className="md:mx-auto md:w-full md:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Weather Planner
        </h2>
      </div>

      <div className="mt-8 md:mx-auto md:w-full md:max-w-md">
        <div className="bg-white py-8 px-4 shadow md:rounded-lg md:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none md:text-sm ${
                    fieldErrors.username 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Only clear field-specific errors, not general errors
                    if (fieldErrors.username) {
                      setFieldErrors(prev => ({ ...prev, username: "" }));
                    }
                  }}
                  placeholder="Enter your username"
                />
                {fieldErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none md:text-sm ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Only clear field-specific errors, not general errors
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: "" }));
                    }
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none md:text-sm ${
                      fieldErrors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    placeholder="Confirm your password"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSignUp ? 'Sign Up' : 'Log In'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>

              {/* Loading spinner */}
              {loading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-3 text-sm text-gray-600">Processing...</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
