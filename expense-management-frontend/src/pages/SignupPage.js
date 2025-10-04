// src/pages/SignupPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import the new components we need for the icon button
import { Container, Box, Typography, TextField, Button, Alert, Select, MenuItem, InputLabel, FormControl, CircularProgress, IconButton, InputAdornment } from '@mui/material';
// Import the icons
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        companyName: '',
        baseCurrency: '',
    });
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    // --- NEW: State and handlers for showing/hiding the password ---
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    // -----------------------------------------------------------

    useEffect(() => {
        const fetchCountries = async () => {
            // ... existing country fetching logic ...
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
                const data = await response.json();
                const countryOptions = data
                    .map(country => {
                        const currencyCode = Object.keys(country.currencies)[0];
                        const currencyName = country.currencies[currencyCode]?.name;
                        return currencyCode && currencyName ? { 
                            name: country.name.common, 
                            currency: currencyCode 
                        } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setCountries(countryOptions);
            } catch (error) {
                setError('Failed to load country data.');
            } finally {
                setLoadingCountries(false);
            }
        };
        fetchCountries();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        try {
            await signup(formData);
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.error || 'Failed to create account.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Create Account
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                    <TextField margin="normal" required fullWidth label="Company Name" name="companyName" onChange={handleChange} />
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="country-currency-label">Country (Currency)</InputLabel>
                        {loadingCountries ? <CircularProgress size={24} /> : (
                            <Select labelId="country-currency-label" name="baseCurrency" value={formData.baseCurrency} label="Country (Currency)" onChange={handleChange}>
                                {countries.map(c => <MenuItem key={c.name} value={c.currency}>{`${c.name} (${c.currency})`}</MenuItem>)}
                            </Select>
                        )}
                    </FormControl>
                    <TextField margin="normal" required fullWidth label="First Name" name="firstName" onChange={handleChange} />
                    <TextField margin="normal" required fullWidth label="Last Name" name="lastName" onChange={handleChange} />
                    <TextField margin="normal" required fullWidth label="Email Address" name="email" type="email" onChange={handleChange} />
                    
                    {/* --- UPDATED: The Password TextField --- */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }}>
                        Sign Up
                    </Button>
                    <Typography variant="body2" align="center">
                        Already have an account? <Link to="/login" style={{ textDecoration: 'none' }}>Log In</Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}