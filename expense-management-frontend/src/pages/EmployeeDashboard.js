// // src/pages/EmployeeDashboard.js
// import React, { useState, useEffect } from 'react';
// import apiClient from '../api/axios';
// import {
//     Container,
//     Typography,
//     Button,
//     Box,
//     CircularProgress,
//     Alert,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Paper,
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     TextField
// } from '@mui/material';

// import { Link } from 'react-router-dom'; // <--- CHANGE 1: NEW IMPORT for Link component

// export default function EmployeeDashboard() {
//     const [reports, setReports] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     // State for the Create Report Dialog
//     const [openDialog, setOpenDialog] = useState(false);
//     const [newReportName, setNewReportName] = useState('');

//     const fetchReports = async () => {
//         try {
//             setLoading(true);
//             const response = await apiClient.get('/reports');
//             setReports(response.data);
//         } catch (err) {
//             setError('Failed to fetch expense reports.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchReports();
//     }, []);
//     {/* The Create Report Dialog component */ }
//     <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
//         <DialogTitle>Create a New Expense Report</DialogTitle>
//         <DialogContent>
//             <TextField
//                 autoFocus
//                 margin="dense"
//                 id="name"
//                 label="Report Name"
//                 type="text"
//                 fullWidth
//                 variant="standard"
//                 value={newReportName}
//                 onChange={(e) => setNewReportName(e.target.value)}
//             />
//         </DialogContent>
//         <DialogActions>
//             <Button onClick={handleCloseDialog}>Cancel</Button>
//             <Button onClick={handleCreateReport} variant="contained">Create</Button>
//         </DialogActions>
//     </Dialog>
//     // Handlers for the Dialog
//     const handleCloseDialog = () => {
//         setOpenDialog(false);
//         setNewReportName(''); // Reset name on close
//     };
//     const handleOpenDialog = () => setOpenDialog(true);
    

//     const handleCreateReport = async () => {
//         if (!newReportName.trim()) {
//             return; // Simple validation
//         }
//         try {
//             const response = await apiClient.post('/reports', { name: newReportName });
//             // Add the new report to the top of the list for immediate feedback
//             setReports([response.data, ...reports]);
//             handleCloseDialog();
//         } catch (error) {
//             // You can add more robust error handling here, like a snackbar
//             console.error("Failed to create report", error);
//             // For now, we'll just log it
//         }
//     };

//     return (
//         <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
//                 <Typography variant="h4" component="h1" gutterBottom>
//                     My Expense Reports
//                 </Typography>
//                 <Box> {/* <--- CHANGE 2: Used Box to group the buttons */}
//                     {/* <--- CHANGE 3: New Button to link to the Create Expense Page */}
//                     <Button
//                         variant="outlined"
//                         component={Link}
//                         to="/expenses/new"
//                         sx={{ mr: 2 }}
//                     >
//                         New Expense
//                     </Button>
//                     <Button variant="contained" onClick={handleOpenDialog}>
//                         Create New Report
//                     </Button>
//                 </Box>
//             </Box>

//             {loading ? (
//                 <Box sx={{ display: 'flex', justifyContent: 'center' }}>
//                     <CircularProgress />
//                 </Box>
//             ) : error ? (
//                 <Alert severity="error">{error}</Alert>
//             ) : (
//                 <TableContainer component={Paper}>
//                     <Table sx={{ minWidth: 650 }}>
//                         <TableHead>
//                             <TableRow>
//                                 <TableCell sx={{ fontWeight: 'bold' }}>Report Name</TableCell>
//                                 <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
//                                 <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {reports.length > 0 ? (
//                                 reports.map((report) => (
//                                     <TableRow key={report.report_id} hover sx={{ cursor: 'pointer' }}>
//                                         <TableCell>{report.name}</TableCell>
//                                         <TableCell>{report.status}</TableCell>
//                                         <TableCell>{report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : 'N/A'}</TableCell>
//                                     </TableRow>
//                                 ))
//                             ) : (
//                                 <TableRow>
//                                     <TableCell colSpan={3} align="center">
//                                         You have no expense reports. Create one to get started!
//                                     </TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//             )}

//             {/* The Create Report Dialog component */}
//             <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
//                 <DialogTitle>Create a New Expense Report</DialogTitle>
//                 <DialogContent>
//                     <TextField
//                         autoFocus
//                         margin="dense"
//                         id="name"
//                         label="Report Name"
//                         type="text"
//                         fullWidth
//                         variant="standard"
//                         value={newReportName}
//                         onChange={(e) => setNewReportName(e.target.value)}
//                     />
//                 </DialogContent>
//                 <DialogActions>
//                     <Button onClick={handleCloseDialog}>Cancel</Button>
//                     <Button onClick={handleCreateReport} variant="contained">Create</Button>
//                 </DialogActions>
//             </Dialog>
//         </Container>
//     );
// }


// src/pages/EmployeeDashboard.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/axios';
import {
    Container,
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
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
    Chip
} from '@mui/material';

import { Link } from 'react-router-dom';

export default function EmployeeDashboard() {
    const location = useLocation();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State for the Create Report Dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [newReportName, setNewReportName] = useState('');

    // Check for success message from navigation
    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccess(location.state.successMessage);
            // Clear the state to prevent showing the message again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/reports');
            setReports(response.data);
        } catch (err) {
            setError('Failed to fetch expense reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // -------------------------------------------------------------------
    // FIX 1: DECLARE HANDLERS BEFORE THEY ARE USED
    // handleCloseDialog must come before handleCreateReport because the latter calls the former.

    const handleOpenDialog = () => setOpenDialog(true);
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewReportName(''); // Reset name on close
    };
    
    const handleCreateReport = async () => {
        if (!newReportName.trim()) {
            return; // Simple validation
        }
        try {
            const response = await apiClient.post('/reports', { name: newReportName });
            // Add the new report to the top of the list for immediate feedback
            setReports([response.data, ...reports]);
            handleCloseDialog(); // This call is now safe because handleCloseDialog is defined above
        } catch (error) {
            // You can add more robust error handling here, like a snackbar
            console.error("Failed to create report", error);
            // For now, we'll just log it
        }
    };
    // -------------------------------------------------------------------
    
    /* FIX 2: REMOVED INCORRECTLY PLACED JSX (THE DIALOG)
    The following block was incorrectly placed outside the final 'return' statement 
    and has been moved down into the main return block.
    
    // Original incorrect placement:
    // {/* The Create Report Dialog component * / }
    // <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
    // ...
    // </Dialog>
    */

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    My Expense Reports
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        component={Link}
                        to="/expenses/new"
                        sx={{ mr: 2 }}
                    >
                        New Expense
                    </Button>
                    <Button variant="contained" onClick={handleOpenDialog}>
                        Create New Report
                    </Button>
                </Box>
            </Box>

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
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
                                <TableCell sx={{ fontWeight: 'bold' }}>Report Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <TableRow key={report.report_id} hover sx={{ cursor: 'pointer' }}>
                                        <TableCell>{report.name}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={report.status} 
                                                color={report.status === 'DRAFT' ? 'default' : 
                                                       report.status === 'SUBMITTED' ? 'warning' :
                                                       report.status === 'APPROVED' ? 'success' : 'error'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>{report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        You have no expense reports. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* FIX 3: THE CREATE REPORT DIALOG JSX IS NOW CORRECTLY PLACED HERE */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>Create a New Expense Report</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Report Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newReportName}
                        onChange={(e) => setNewReportName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleCreateReport} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}