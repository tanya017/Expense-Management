// src/pages/UserManagementPage.js
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'EMPLOYEE',
        managerId: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [temporaryPassword, setTemporaryPassword] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        
        try {
            const response = await apiClient.post('/admin/users', formData);
            setTemporaryPassword(response.data.temporaryPassword);
            setSuccess('User created successfully!');
            fetchUsers(); // Refresh the list
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                role: 'EMPLOYEE',
                managerId: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            role: 'EMPLOYEE',
            managerId: ''
        });
        setTemporaryPassword('');
        setError('');
        setSuccess('');
    };

    // Get managers for the dropdown (users with MANAGER or ADMIN role)
    const managers = users.filter(user => user.role === 'MANAGER' || user.role === 'ADMIN');

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'error';
            case 'MANAGER': return 'warning';
            case 'EMPLOYEE': return 'info';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add User
                </Button>
            </Box>

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
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Manager</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.user_id}>
                                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={user.role} 
                                                color={getRoleColor(user.role)} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {user.manager_first_name && user.manager_last_name 
                                                ? `${user.manager_first_name} ${user.manager_last_name}`
                                                : 'None'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create User Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                            {temporaryPassword && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Temporary Password: {temporaryPassword}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Please share this password with the user securely.
                                    </Typography>
                                </Box>
                            )}
                        </Alert>
                    )}
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        label="First Name"
                        name="firstName"
                        fullWidth
                        variant="standard"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Last Name"
                        name="lastName"
                        fullWidth
                        variant="standard"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Email Address"
                        name="email"
                        type="email"
                        fullWidth
                        variant="standard"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <FormControl fullWidth margin="dense" variant="standard">
                        <InputLabel id="role-label">Role</InputLabel>
                        <Select
                            labelId="role-label"
                            name="role"
                            value={formData.role}
                            label="Role"
                            onChange={handleChange}
                        >
                            <MenuItem value="EMPLOYEE">Employee</MenuItem>
                            <MenuItem value="MANAGER">Manager</MenuItem>
                            <MenuItem value="ADMIN">Admin</MenuItem>
                        </Select>
                    </FormControl>
                    
                    {formData.role === 'EMPLOYEE' && (
                        <FormControl fullWidth margin="dense" variant="standard">
                            <InputLabel id="manager-label">Manager (Required for Employees)</InputLabel>
                            <Select
                                labelId="manager-label"
                                name="managerId"
                                value={formData.managerId}
                                label="Manager (Required for Employees)"
                                onChange={handleChange}
                                required
                            >
                                {managers.map((manager) => (
                                    <MenuItem key={manager.user_id} value={manager.user_id}>
                                        {manager.first_name} {manager.last_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
