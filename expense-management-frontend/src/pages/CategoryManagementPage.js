// src/pages/CategoryManagementPage.js
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        gl_code: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/categories');
            setCategories(response.data);
        } catch (err) {
            setError('Failed to fetch categories.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        
        try {
            if (editingCategory) {
                // Update existing category
                await apiClient.put(`/admin/categories/${editingCategory.category_id}`, formData);
                setSuccess('Category updated successfully!');
            } else {
                // Create new category
                await apiClient.post('/admin/categories', formData);
                setSuccess('Category created successfully!');
            }
            
            fetchCategories(); // Refresh the list
            handleCloseDialog();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save category.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            gl_code: category.gl_code || ''
        });
        setOpenDialog(true);
    };

    const handleDelete = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await apiClient.delete(`/admin/categories/${categoryId}`);
                setSuccess('Category deleted successfully!');
                fetchCategories(); // Refresh the list
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to delete category.');
            }
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            gl_code: ''
        });
        setError('');
        setSuccess('');
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Expense Categories
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add Category
                </Button>
            </Box>

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>GL Code</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <TableRow key={category.category_id}>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>{category.gl_code || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit">
                                                <IconButton 
                                                    color="primary" 
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton 
                                                    color="error" 
                                                    onClick={() => handleDelete(category.category_id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        No categories found. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create/Edit Category Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Category Name"
                        name="name"
                        fullWidth
                        variant="standard"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="GL Code (Optional)"
                        name="gl_code"
                        fullWidth
                        variant="standard"
                        value={formData.gl_code}
                        onChange={handleChange}
                        placeholder="e.g., 5001"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={submitting || !formData.name.trim()}
                    >
                        {submitting ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
