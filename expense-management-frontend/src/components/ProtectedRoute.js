// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        // If user is not logged in, redirect them to the /login page
        return <Navigate to="/login" />;
    }

    return children; // If logged in, render the component they are trying to access
};

export default ProtectedRoute;