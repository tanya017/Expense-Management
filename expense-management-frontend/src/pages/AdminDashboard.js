// src/pages/AdminDashboard.js
import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useAuth();
    
    // Define the main Admin navigation links
    const adminActions = [
        { title: "User Management", description: "Create, view, and assign roles to company employees.", icon: PeopleIcon, path: "/admin/users" },
        { title: "Categories", description: "Manage expense categories and GL codes.", icon: SettingsIcon, path: "/admin/categories" },
        { title: "Reports Overview", description: "View all expense reports and their status.", icon: ViewListIcon, path: "/admin/reports" },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Admin Control Panel
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                Welcome back, {user?.firstName}! Manage your company settings and users.
            </Typography>
            
            <Box sx={{ mt: 5 }}>
                <Grid container spacing={4}>
                    {adminActions.map((action) => (
                        <Grid item xs={12} sm={6} md={4} key={action.title}>
                            <Card sx={{ height: '100%' }}>
                                <CardActionArea component={Link} to={action.path} sx={{ p: 2 }}>
                                    <CardContent>
                                        <action.icon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography gutterBottom variant="h5" component="div">
                                            {action.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {action.description}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    );
}