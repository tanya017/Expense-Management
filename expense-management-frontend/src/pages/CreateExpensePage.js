// src/pages/CreateExpensePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { 
    Container, 
    Typography, 
    Box, 
    TextField, 
    Button, 
    CircularProgress, 
    Alert, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    Grid,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function CreateExpensePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        original_amount: '',
        original_currency: 'USD', // Default to a common currency
        merchant: '',
        expense_date: new Date().toISOString().substring(0, 10), // Default to today's date
        description: '',
        category_id: '',
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // State for a simple list of popular currencies for the selector
    const popularCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'INR']; 

    // --- Data Fetching: Categories ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Using the correct endpoint from the backend
                const response = await apiClient.get('/categories');
                // Ensure category IDs are strings or numbers as expected by the backend
                setCategories(response.data.map(cat => ({ ...cat, id: String(cat.category_id) })));
            } catch (err) {
                setError('Failed to load expense categories. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        // Basic validation
        if (!formData.original_amount || !formData.merchant || !formData.category_id) {
            setError('Please fill in all required fields: Amount, Merchant, and Category.');
            setSubmitting(false);
            return;
        }

        try {
            // First, create a new report if needed, then add expense to it
            // For simplicity, we'll create a new report for each expense
            const reportResponse = await apiClient.post('/reports', {
                name: `Expense Report - ${new Date().toLocaleDateString()}`
            });
            
            // Then add the expense to the report
            await apiClient.post(`/reports/${reportResponse.data.report_id}/expenses`, {
                ...formData,
                original_amount: parseFloat(formData.original_amount), // Ensure amount is a number
            });
            
            // Success: Navigate back to the dashboard
            navigate('/', { state: { successMessage: 'Expense successfully created and saved as a Draft.' } });
        } catch (err) {
            console.error("Failed to create expense", err);
            setError(err.response?.data?.error || 'Failed to create expense. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>Loading setup data...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                New Expense
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
                Fill in the details below to create a new expense draft. It will appear on your dashboard.
            </Alert>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                    {/* --- Amount and Currency --- */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Amount"
                            name="original_amount"
                            type="number"
                            fullWidth
                            required
                            value={formData.original_amount}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel id="currency-label">Currency</InputLabel>
                            <Select
                                labelId="currency-label"
                                name="original_currency"
                                value={formData.original_currency}
                                label="Currency"
                                onChange={handleChange}
                            >
                                {popularCurrencies.map((code) => (
                                    <MenuItem key={code} value={code}>{code}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* --- Merchant and Date --- */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Merchant Name"
                            name="merchant"
                            fullWidth
                            required
                            value={formData.merchant}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Date of Expense"
                            name="expense_date"
                            type="date"
                            fullWidth
                            required
                            value={formData.expense_date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* --- Category and Description --- */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select
                                labelId="category-label"
                                name="category_id"
                                value={formData.category_id}
                                label="Category"
                                onChange={handleChange}
                            >
                                {categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))
                                ) : (
                                    <MenuItem value="" disabled>No categories found</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Description/Notes (Optional)"
                            name="description"
                            fullWidth
                            multiline
                            rows={1}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* --- Receipt/OCR Placeholder --- */}
                    <Grid item xs={12}>
                        <Button 
                            variant="outlined" 
                            startIcon={<AttachFileIcon />} 
                            component="label" 
                            sx={{ mr: 2 }}
                            onClick={() => alert('Feature: Receipt OCR/Upload (Coming Soon!)')}
                        >
                            Upload Receipt (OCR)
                        </Button>
                        <Typography variant="caption" color="textSecondary">
                            Drag-and-drop or click to upload a receipt for auto-filling.
                        </Typography>
                    </Grid>

                    {/* --- Submission Buttons --- */}
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                            onClick={() => navigate('/')} 
                            disabled={submitting} 
                            sx={{ mr: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            disabled={submitting}
                            startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                        >
                            {submitting ? 'Saving...' : 'Save as Draft'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}