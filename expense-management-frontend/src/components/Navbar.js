// src/components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Expense Manager
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {user && (
                        <>
                            <Typography variant="body2">
                                Welcome, {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                px: 1, 
                                py: 0.5, 
                                backgroundColor: 'rgba(255,255,255,0.2)', 
                                borderRadius: 1,
                                fontSize: '0.75rem'
                            }}>
                                {user.role}
                            </Typography>
                            <Button color="inherit" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
