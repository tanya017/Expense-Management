// src/App.js 
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import SignupPage from './pages/SignupPage';
// import LoginPage from './pages/LoginPage';
// import EmployeeDashboard from './pages/EmployeeDashboard';
// import ProtectedRoute from './components/ProtectedRoute';
// import CreateExpensePage from './pages/CreateExpensePage';

// function App() {
//     return (
//         <AuthProvider>
//             <Router>
//                 <Routes>
//                     <Route path="/signup" element={<SignupPage />} />
//                     <Route path="/login" element={<LoginPage />} />
//                     <Route
//                         path="/"
//                         element={
//                             <ProtectedRoute>
//                                 <EmployeeDashboard />
//                             </ProtectedRoute>
//                         }
//                     />
//                     <Route path="/expenses/new" element={
//                         <ProtectedRoute>
//                             <CreateExpensePage />
//                         </ProtectedRoute>
//                     } />
//                 </Routes>
//             </Router>
//         </AuthProvider>
//     );
// }

// export default App;

// src/App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // <--- CHANGE 1: Import useAuth
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CreateExpensePage from './pages/CreateExpensePage';
import AdminDashboard from './pages/AdminDashboard'; // <--- CHANGE 2: Import AdminDashboard
import UserManagementPage from './pages/UserManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import ReportsManagementPage from './pages/ReportsManagementPage';
import Navbar from './components/Navbar'; // <--- NEW: Import Navbar

// --- CHANGE 3: New Component to handle role-based redirection ---
const RoleBasedDashboard = () => {
    const { isAdmin } = useAuth(); // Assume isAdmin is provided by AuthContext
    // If the user is an Admin, show the Admin Dashboard; otherwise, show the Employee Dashboard.
    return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Protected Root Route */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                {/* CHANGE 4: Use the RoleBasedDashboard for the main route */}
                                <RoleBasedDashboard />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Protected Expense Creation Route */}
                    <Route path="/expenses/new" element={
                        <ProtectedRoute>
                            <CreateExpensePage />
                        </ProtectedRoute>
                    } />

                    {/* Admin-Specific Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                        <ProtectedRoute>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/categories" element={
                        <ProtectedRoute>
                            <CategoryManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/reports" element={
                        <ProtectedRoute>
                            <ReportsManagementPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;