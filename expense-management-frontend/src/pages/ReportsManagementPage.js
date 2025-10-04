// src/pages/ReportsManagementPage.js
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import {
    Container,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ReportsManagementPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Dialog states for viewing report details
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportDetails, setReportDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            // Note: This would need a new endpoint in the backend for admins to view all reports
            // For now, we'll use the existing endpoint which returns user's own reports
            const response = await apiClient.get('/reports');
            setReports(response.data);
        } catch (err) {
            setError('Failed to fetch reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleViewReport = async (report) => {
        setSelectedReport(report);
        setOpenDialog(true);
        setLoadingDetails(true);
        
        try {
            const response = await apiClient.get(`/reports/${report.report_id}`);
            setReportDetails(response.data);
        } catch (err) {
            setError('Failed to fetch report details.');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedReport(null);
        setReportDetails(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DRAFT': return 'default';
            case 'SUBMITTED': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Expense Reports Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                View and manage all expense reports in your company.
            </Typography>

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
                                <TableCell sx={{ fontWeight: 'bold' }}>Report Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Last Action</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <TableRow key={report.report_id}>
                                        <TableCell>{report.name}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={report.status} 
                                                color={getStatusColor(report.status)} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {report.submitted_at 
                                                ? new Date(report.submitted_at).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {report.last_action_at 
                                                ? new Date(report.last_action_at).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleViewReport(report)}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No reports found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Report Details Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
                <DialogTitle>
                    Report Details: {selectedReport?.name}
                </DialogTitle>
                <DialogContent>
                    {loadingDetails ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : reportDetails ? (
                        <Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Report Information
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Status:</strong> {reportDetails.status}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Submitted:</strong> {reportDetails.submitted_at 
                                        ? new Date(reportDetails.submitted_at).toLocaleString()
                                        : 'Not submitted'
                                    }
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Last Action:</strong> {reportDetails.last_action_at 
                                        ? new Date(reportDetails.last_action_at).toLocaleString()
                                        : 'N/A'
                                    }
                                </Typography>
                            </Box>

                            {reportDetails.expenses && reportDetails.expenses.length > 0 ? (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Expenses ({reportDetails.expenses.length})
                                    </Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Merchant</TableCell>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>Currency</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportDetails.expenses.map((expense) => (
                                                <TableRow key={expense.expense_id}>
                                                    <TableCell>{expense.merchant}</TableCell>
                                                    <TableCell>
                                                        {new Date(expense.expense_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{expense.original_amount}</TableCell>
                                                    <TableCell>{expense.original_currency}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No expenses in this report.
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Typography>Failed to load report details.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
