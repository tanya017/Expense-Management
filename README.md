# Expense Management System

A full-stack expense management application with role-based access control, built with React frontend and Node.js/Express backend.

## Features

### Authentication & Authorization
- **Company Registration**: Admins can register their company with base currency
- **User Management**: Role-based access (Admin, Manager, Employee)
- **Secure Authentication**: JWT-based authentication with password hashing

### Employee Features
- **Create Expense Reports**: Create and manage expense reports
- **Add Expenses**: Add individual expenses to reports with categories
- **Report Submission**: Submit reports for approval
- **View Reports**: Track report status and history

### Manager Features
- **Approval Workflow**: Approve or reject expense reports
- **Pending Approvals**: View all reports awaiting approval
- **Report Oversight**: Monitor employee expense submissions

### Admin Features
- **User Management**: Create, update, and manage company users
- **Category Management**: Create and manage expense categories with GL codes
- **System Configuration**: Set up approval workflows
- **Global Reports View**: Oversee all company expense reports

## Technology Stack

### Frontend
- **React 19.2.0** - UI framework
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management for authentication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (version 14 or higher)
2. **PostgreSQL** (version 12 or higher)
3. **npm** or **yarn** package manager

## Database Setup

1. Create a PostgreSQL database for the application:
```sql
CREATE DATABASE expense_management;
```

2. Set up the database tables. You'll need to create the following tables based on your backend schema:
   - `companies`
   - `users`
   - `reports`
   - `expenses`
   - `expense_categories`
   - `approval_workflows`
   - `workflow_approvers`
   - `report_approvals`

3. Create a `.env` file in the `expense-management-backend` directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/expense_management
JWT_SECRET=your_jwt_secret_key_here
PORT=3001
```

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd expense-management-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd expense-management-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend application will run on `http://localhost:3000`

## Usage Guide

### Getting Started

1. **Company Registration**:
   - Visit `http://localhost:3000/signup`
   - Fill in company details (name, currency, admin information)
   - Complete the registration form

2. **Admin Login**:
   - Use the credentials from registration to log in
   - Access the Admin Dashboard with full system controls

3. **Setting Up Categories**:
   - Navigate to "Categories" from the Admin Dashboard
   - Create expense categories (e.g., Travel, Meals, Office Supplies)
   - Add GL codes for accounting integration

4. **User Management**:
   - Go to "User Management" from Admin Dashboard
   - Create employees and managers
   - Assign managers to employees for approval workflows

### Employee Workflow

1. **Creating Expenses**:
   - Click "New Expense" from the dashboard
   - Fill in expense details (amount, merchant, date, category)
   - Save as draft or submit for approval

2. **Managing Reports**:
   - View all expense reports in the dashboard
   - Create new reports for organizing expenses
   - Submit reports when ready for approval

### Manager Workflow

1. **Approving Reports**:
   - Access pending approvals from the dashboard
   - Review expense details and amounts
   - Approve or reject with comments

### Admin Workflow

1. **System Management**:
   - Monitor all user activities
   - Manage expense categories
   - Oversee approval workflows
   - Handle user account management

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Company registration
- `POST /api/auth/login` - User login
- `GET /api/me` - Get current user info

### Reports
- `GET /api/reports` - Get user's reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports/:id/expenses` - Add expense to report
- `PUT /api/reports/:id/submit` - Submit report for approval

### Admin
- `GET /api/admin/users` - Get all company users
- `POST /api/admin/users` - Create new user
- `GET /api/categories` - Get expense categories
- `POST /api/admin/categories` - Create new category

### Approvals
- `GET /api/approvals/pending` - Get pending approvals
- `PUT /api/approvals/reports/:id/approve` - Approve report
- `PUT /api/approvals/reports/:id/reject` - Reject report

## Project Structure

```
expense-management-app/
├── expense-management-backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
├── expense-management-frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # API configuration
│   │   ├── components/
│   │   │   ├── Navbar.js      # Navigation component
│   │   │   └── ProtectedRoute.js # Route protection
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── pages/
│   │   │   ├── LoginPage.js   # Login form
│   │   │   ├── SignupPage.js  # Registration form
│   │   │   ├── EmployeeDashboard.js # Employee interface
│   │   │   ├── AdminDashboard.js    # Admin interface
│   │   │   ├── UserManagementPage.js # User management
│   │   │   ├── CategoryManagementPage.js # Category management
│   │   │   ├── ReportsManagementPage.js # Reports overview
│   │   │   └── CreateExpensePage.js # Expense creation
│   │   ├── App.js             # Main app component
│   │   └── index.js           # App entry point
│   └── package.json           # Frontend dependencies
└── README.md                  # This file
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: Client and server-side validation
- **CORS Protection**: Configured for secure cross-origin requests

## Development Notes

- The application uses Material-UI for consistent, modern design
- All API calls include proper error handling and loading states
- Form validation ensures data integrity
- Responsive design works on desktop and mobile devices
- State management is handled through React Context API

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check database credentials in `.env` file
   - Ensure database exists

2. **Port Already in Use**:
   - Backend: Change PORT in `.env` file
   - Frontend: React will automatically suggest alternative port

3. **CORS Issues**:
   - Backend has CORS enabled for `http://localhost:3000`
   - Verify frontend is running on correct port

4. **Authentication Issues**:
   - Check JWT_SECRET is set in `.env`
   - Verify token is being stored in localStorage
   - Check browser developer tools for network errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository or contact the development team.
