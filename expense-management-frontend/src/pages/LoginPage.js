// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Box, Typography, TextField, Button, Alert, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // --- NEW: State for field-specific errors ---
    const [formErrors, setFormErrors] = useState({});
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => event.preventDefault();

    // --- NEW: Validation Function ---
    const validateForm = () => {
        const errors = {};
        if (!email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Email address is invalid';
        }
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        return errors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        
        // --- NEW: Run validation before submitting ---
        const validationErrors = validateForm();
        setFormErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return; // Stop submission if there are errors
        }

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.error || 'Failed to log in.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
             <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>Expense Manager</Typography>
                <Typography component="h2" variant="h6" color="text.secondary">Sign in to your account</Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3, width: '100%' }}>
                    {/* --- UPDATED: TextField with error props --- */}
                    <TextField
                        margin="normal" required fullWidth id="email"
                        label="Email Address" name="email" autoComplete="email"
                        autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                    />
                    <TextField
                        margin="normal" required fullWidth name="password"
                        label="Password" type={showPassword ? 'text' : 'password'} id="password"
                        autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }}>Sign In</Button>
                    <Typography variant="body2" align="center">
                        Don't have an account? <Link to="/signup" style={{ textDecoration: 'none' }}>Sign Up</Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}