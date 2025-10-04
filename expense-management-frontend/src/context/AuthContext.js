// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axios';

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

        // --- NEW: Function to load user from stored token/backend on mount ---
    useEffect(() => {
        const loadUserFromToken = async () => {
            if (token) {
                try {
                    // Using the correct endpoint from the backend
                    const response = await apiClient.get('/me'); 
                    setUser(response.data);
                } catch (error) {
                    // Token is invalid or expired
                    logout();
                }
            }
        };
        loadUserFromToken();
    }, [token]);
    // ---------------------------------------------------------------------

    // The login function that our components will call
    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { token } = response.data; // Backend only returns token

            // Store the token in state and local storage
            setToken(token);
            localStorage.setItem('token', token);

            // Fetch user data after successful login
            const userResponse = await apiClient.get('/me');
            setUser(userResponse.data);

        } catch (error) {
            // If the API call fails, it will have a response object with an error message
            // We re-throw this error so the component can catch it and display it
            throw error.response.data;
        }
    };

    // --- ADD THIS NEW SIGNUP FUNCTION ---
    const signup = async (signupData) => {
        try {
            // The backend returns a success message, not a token
            const response = await apiClient.post('/auth/signup', signupData);
            return response.data; // Return the success data
        } catch (error) {
            // Re-throw the error to be caught by the component
            throw error.response.data;
        }
    };


    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

     // --- NEW: Helper function to check role ---
    const isAdmin = user && user.role === 'ADMIN';

    // The value provided to all consuming components
    const value = {
        user,
        token,
        login,
        signup,
        logout,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook for easy access to the context
export const useAuth = () => {
    return useContext(AuthContext);
};