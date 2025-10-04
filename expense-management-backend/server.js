// server.js

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const cors = require('cors');
app.use(cors());
// server.js (add this middleware)
const authMiddleware = (req, res, next) => {
    // Get token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (token == null) {
        return res.sendStatus(401); // Unauthorized - No token provided
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden - Token is invalid or expired
        }
        
        // If token is valid, attach the decoded payload to the request object
        req.user = user;
        next(); // Proceed to the next function (the route handler)
    });
};

// Middleware to authorize users based on their role
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        // req.user is attached by the preceding authMiddleware
        const userRole = req.user.role;

        if (allowedRoles.includes(userRole)) {
            next(); // User has the required role, proceed to the route handler
        } else {
            res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
        }
    };
};

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Simple test route to check DB connection
app.get('/test-db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        res.json({ message: 'Database connection successful!', time: result.rows[0].now });
        client.release();
    } catch (err) {
        console.error('Database connection error', err.stack);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});


// POST /api/auth/signup - Company and Admin Registration
app.post('/api/auth/signup', async (req, res) => {
    const { companyName, baseCurrency, firstName, lastName, email, password } = req.body;

    // --- Input Validation ---
    if (!companyName || !baseCurrency || !firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const client = await pool.connect();

    try {
        // --- Start Transaction ---
        await client.query('BEGIN');

        // 1. Create the company
        const companyInsertQuery = 'INSERT INTO companies (name, base_currency) VALUES ($1, $2) RETURNING company_id';
        const companyResult = await client.query(companyInsertQuery, [companyName, baseCurrency]);
        const newCompanyId = companyResult.rows[0].company_id;

        // 2. Hash the admin's password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Create the admin user linked to the new company
        const userInsertQuery = `
            INSERT INTO users (company_id, first_name, last_name, email, password_hash, role)
            VALUES ($1, $2, $3, $4, $5, 'ADMIN')
            RETURNING user_id, email, role;
        `;
        const userResult = await client.query(userInsertQuery, [
            newCompanyId,
            firstName,
            lastName,
            email.toLowerCase(),
            passwordHash,
        ]);
        
        // --- Commit Transaction ---
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Company and Admin user created successfully!',
            user: userResult.rows[0],
            companyId: newCompanyId,
        });

    } catch (err) {
        // --- Rollback Transaction on Error ---
        await client.query('ROLLBACK');
        console.error('Signup error:', err.stack);

        // Check for unique email violation
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }
        
        res.status(500).json({ error: 'Internal server error during registration.' });
    } finally {
        // --- Release the client back to the pool ---
        client.release();
    }
});
// POST /api/auth/login - User Login (UPDATED AND MORE ROBUST)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // --- CHANGE HERE ---
        // We now use TRIM() in the SQL query and .trim() on the input
        // to ignore any accidental whitespace.
        const userQuery = 'SELECT * FROM users WHERE TRIM(email) = $1';
        const userResult = await pool.query(userQuery, [email.trim().toLowerCase()]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const payload = {
            userId: user.user_id,
            companyId: user.company_id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Logged in successfully!',
            token: token
        });

    } catch (err) {
        console.error('Login error:', err.stack);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
// // POST /api/auth/login - User Login
// app.post('/api/auth/login', async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ error: 'Email and password are required.' });
//     }

//     try {
//         // 1. Find the user by email
//         const userQuery = 'SELECT * FROM users WHERE email = $1';
//         const userResult = await pool.query(userQuery, [email.toLowerCase()]);

//         if (userResult.rows.length === 0) {
//             // Use a generic error for security (don't reveal if the email exists)
//             return res.status(401).json({ error: 'Invalid credentials.' });
//         }

//         const user = userResult.rows[0];

//         // 2. Compare the provided password with the stored hash
//         const isMatch = await bcrypt.compare(password, user.password_hash);

//         if (!isMatch) {
//             return res.status(401).json({ error: 'Invalid credentials.' });
//         }

//         // 3. If passwords match, create the JWT payload
//         const payload = {
//             userId: user.user_id,
//             companyId: user.company_id,
//             role: user.role
//         };

//         // 4. Sign the token
//         const token = jwt.sign(
//             payload,
//             process.env.JWT_SECRET,
//             { expiresIn: '1d' } // Token expires in 1 day
//         );

//         // 5. Send the token to the client
//         res.json({
//             message: 'Logged in successfully!',
//             token: token
//         });

//     } catch (err) {
//         console.error('Login error:', err.stack);
//         res.status(500).json({ error: 'Internal server error.' });
//     }
// });

// server.js (add this protected route)

// GET /api/me - A protected route to get the current user's info
app.get('/api/me', authMiddleware, async (req, res) => {
    // Because the authMiddleware ran successfully, we have access to req.user
    // The user's ID was attached to the request object from the JWT payload

    try {
        const userQuery = 'SELECT user_id, first_name, last_name, email, role FROM users WHERE user_id = $1';
        const { rows } = await pool.query(userQuery, [req.user.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Get profile error:', err.stack);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/reports - Create a new expense report
app.post('/api/reports', authMiddleware, async (req, res) => {
    const { name } = req.body;
    const { userId, companyId } = req.user; // From our authMiddleware

    if (!name) {
        return res.status(400).json({ error: 'Report name is required.' });
    }

    try {
        const newReportQuery = `
            INSERT INTO reports (employee_id, company_id, name, status)
            VALUES ($1, $2, $3, 'DRAFT')
            RETURNING *;
        `;
        const { rows } = await pool.query(newReportQuery, [userId, companyId, name]);
        
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Create report error:', err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports - Get all reports for the logged-in user
app.get('/api/reports', authMiddleware, async (req, res) => {
    const { userId } = req.user;

    try {
        const allReportsQuery = `
            SELECT report_id, name, status, submitted_at, last_action_at
            FROM reports
            WHERE employee_id = $1
            ORDER BY last_action_at DESC, report_id DESC;
        `;
        const { rows } = await pool.query(allReportsQuery, [userId]);
        
        res.json(rows);
    } catch (err) {
        console.error('Get reports error:', err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// POST /api/reports/:reportId/expenses - Add an expense to a specific report
app.post('/api/reports/:reportId/expenses', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const { userId } = req.user;
    const { merchant, expense_date, original_amount, original_currency, category_id } = req.body;

    // --- Basic Input Validation ---
    if (!merchant || !expense_date || !original_amount || !original_currency) {
        return res.status(400).json({ error: 'Missing required expense fields.' });
    }

    const client = await pool.connect();

    try {
        // --- Start Transaction ---
        await client.query('BEGIN');

        // 1. **AUTHORIZATION CHECK**: Verify the user owns the report and it's a draft
        const reportQuery = 'SELECT employee_id, status FROM reports WHERE report_id = $1';
        const reportResult = await client.query(reportQuery, [reportId]);

        if (reportResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found.' });
        }

        const report = reportResult.rows[0];
        if (report.employee_id !== userId) {
            await client.query('ROLLBACK');
            // User does not own this report
            return res.status(403).json({ error: 'Access denied to this report.' });
        }

        if (report.status !== 'DRAFT') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cannot add expenses to a non-draft report.' });
        }

        // 2. Insert the new expense
        const newExpenseQuery = `
            INSERT INTO expenses (report_id, merchant, expense_date, original_amount, original_currency, category_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const expenseResult = await client.query(newExpenseQuery, [
            reportId, merchant, expense_date, original_amount, original_currency, category_id
        ]);
        
        // 3. (Good Practice) Update the report's last action timestamp
        const updateReportQuery = 'UPDATE reports SET last_action_at = NOW() WHERE report_id = $1';
        await client.query(updateReportQuery, [reportId]);

        // --- Commit Transaction ---
        await client.query('COMMIT');

        res.status(201).json(expenseResult.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Add expense error:', err.stack);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /api/reports/:reportId - Get a single report and all its associated expenses
app.get('/api/reports/:reportId', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const { userId } = req.user;

    try {
        const query = `
            SELECT
                r.report_id,
                r.name,
                r.status,
                r.submitted_at,
                r.last_action_at,
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'expense_id', e.expense_id,
                            'merchant', e.merchant,
                            'expense_date', e.expense_date,
                            'original_amount', e.original_amount,
                            'original_currency', e.original_currency
                        )
                    ) FILTER (WHERE e.expense_id IS NOT NULL),
                    '[]'::jsonb
                ) as expenses
            FROM
                reports r
            LEFT JOIN
                expenses e ON r.report_id = e.report_id
            WHERE
                r.report_id = $1 AND r.employee_id = $2
            GROUP BY
                r.report_id;
        `;
        
        const { rows } = await pool.query(query, [reportId, userId]);

        if (rows.length === 0) {
            // This handles both "report not found" and "user does not own report"
            return res.status(404).json({ error: 'Report not found or access denied.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Get single report error:', err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/reports/:reportId/submit - Submit a draft report for approval
// PUT /api/reports/:reportId/submit - Submit a report, triggering the correct workflow
app.put('/api/reports/:reportId/submit', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const { userId } = req.user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Basic validation (same as before)
        const report = (await client.query('SELECT employee_id, status FROM reports WHERE report_id = $1', [reportId])).rows[0];
        if (!report || report.employee_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Report not found or access denied.' });
        }
        if (report.status !== 'DRAFT') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Report has already been submitted.' });
        }

        // 2. Check for a custom workflow assigned to this user
        const workflowQuery = 'SELECT * FROM approval_workflows WHERE applies_to_user_id = $1';
        const workflowResult = await client.query(workflowQuery, [userId]);

        let initialApprovers = [];

        if (workflowResult.rows.length > 0) {
            // --- Custom Workflow Found ---
            const workflow = workflowResult.rows[0];
            const approversQuery = 'SELECT approver_id, step_order FROM workflow_approvers WHERE workflow_id = $1 ORDER BY step_order ASC';
            const approvers = (await client.query(approversQuery, [workflow.workflow_id])).rows;

            if (workflow.approval_mode === 'SEQUENTIAL') {
                initialApprovers.push({ approver_id: approvers[0].approver_id, step_order: approvers[0].step_order });
            } else { // PARALLEL
                initialApprovers = approvers.map(a => ({ approver_id: a.approver_id, step_order: null }));
            }
        } else {
            // --- No Custom Workflow: Fallback to Direct Manager ---
            const managerQuery = 'SELECT manager_id FROM users WHERE user_id = $1';
            const managerResult = await client.query(managerQuery, [userId]);
            const managerId = managerResult.rows[0]?.manager_id;
            if (!managerId) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'No approval workflow or manager found for this user.' });
            }
            initialApprovers.push({ approver_id: managerId, step_order: 1 });
        }

        // 3. Create the initial PENDING entries in the report_approvals table
        const approvalInsertPromises = initialApprovers.map(approver => {
            const insertQuery = `
                INSERT INTO report_approvals (report_id, approver_id, status, step_order)
                VALUES ($1, $2, 'PENDING', $3);
            `;
            return client.query(insertQuery, [reportId, approver.approver_id, approver.step_order]);
        });
        await Promise.all(approvalInsertPromises);

        // 4. Update the report status to SUBMITTED
        const updateReportQuery = `
            UPDATE reports SET status = 'SUBMITTED', submitted_at = NOW(), last_action_at = NOW()
            WHERE report_id = $1 RETURNING *;
        `;
        const updatedReport = (await client.query(updateReportQuery, [reportId])).rows[0];
        
        await client.query('COMMIT');
        res.json(updatedReport);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Submit report error:', err.stack);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});
// app.put('/api/reports/:reportId/submit', authMiddleware, async (req, res) => {
//     const { reportId } = req.params;
//     const { userId } = req.user;

//     const client = await pool.connect();

//     try {
//         await client.query('BEGIN');

//         // 1. **AUTHORIZATION**: Get the report and check ownership and status
//         const reportQuery = 'SELECT employee_id, status FROM reports WHERE report_id = $1';
//         const reportResult = await client.query(reportQuery, [reportId]);

//         if (reportResult.rows.length === 0) {
//             await client.query('ROLLBACK');
//             return res.status(404).json({ error: 'Report not found.' });
//         }

//         const report = reportResult.rows[0];
//         if (report.employee_id !== userId) {
//             await client.query('ROLLBACK');
//             return res.status(403).json({ error: 'You are not authorized to submit this report.' });
//         }

//         if (report.status !== 'DRAFT') {
//             await client.query('ROLLBACK');
//             return res.status(400).json({ error: 'This report has already been submitted or processed.' });
//         }

//         // 2. **VALIDATION**: Check if the report has at least one expense
//         const expenseCountQuery = 'SELECT COUNT(*) FROM expenses WHERE report_id = $1';
//         const expenseCountResult = await client.query(expenseCountQuery, [reportId]);
//         const expenseCount = parseInt(expenseCountResult.rows[0].count, 10);

//         if (expenseCount === 0) {
//             await client.query('ROLLBACK');
//             return res.status(400).json({ error: 'Cannot submit an empty report. Please add at least one expense.' });
//         }

//         // 3. **UPDATE**: Change the status and set timestamps
//         const updateQuery = `
//             UPDATE reports
//             SET status = 'SUBMITTED', submitted_at = NOW(), last_action_at = NOW()
//             WHERE report_id = $1
//             RETURNING *;
//         `;
//         const updatedReportResult = await client.query(updateQuery, [reportId]);
        
//         await client.query('COMMIT');

//         res.json(updatedReportResult.rows[0]);

//     } catch (err) {
//         await client.query('ROLLBACK');
//         console.error('Submit report error:', err.stack);
//         res.status(500).json({ error: 'Internal server error' });
//     } finally {
//         client.release();
//     }
// });


// Manager
// GET /api/approvals/pending - Get all reports awaiting the manager's approval
// GET /api/approvals/pending - Get all reports awaiting the logged-in user's approval
app.get(
    '/api/approvals/pending',
    authMiddleware,
    authorizeRole(['MANAGER', 'ADMIN']), // Or any role that can be an approver
    async (req, res) => {
        const approverId = req.user.userId;

        try {
            // This query now looks at the new report_approvals table
            const pendingReportsQuery = `
                SELECT
                    r.report_id,
                    r.name,
                    r.submitted_at,
                    u.first_name AS employee_first_name,
                    u.last_name AS employee_last_name
                FROM
                    report_approvals ra
                JOIN
                    reports r ON ra.report_id = r.report_id
                JOIN
                    users u ON r.employee_id = u.user_id
                WHERE
                    ra.approver_id = $1 AND ra.status = 'PENDING'
                ORDER BY
                    r.submitted_at ASC;
            `;

            const { rows } = await pool.query(pendingReportsQuery, [approverId]);
            res.json(rows);

        } catch (err) {
            console.error('Get pending approvals error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);
// app.get(
//     '/api/approvals/pending',
//     authMiddleware,
//     authorizeRole(['MANAGER', 'ADMIN']),
//     async (req, res) => {
//         const managerId = req.user.userId;

//         try {
//             const pendingReportsQuery = `
//                 SELECT
//                     r.report_id,
//                     r.name,
//                     r.status,
//                     r.submitted_at,
//                     u.first_name AS employee_first_name,
//                     u.last_name AS employee_last_name
//                 FROM
//                     reports r
//                 JOIN
//                     users u ON r.employee_id = u.user_id
//                 WHERE
//                     r.status = 'SUBMITTED' AND u.manager_id = $1
//                 ORDER BY
//                     r.submitted_at ASC;
//             `;

//             const { rows } = await pool.query(pendingReportsQuery, [managerId]);
//             res.json(rows);

//         } catch (err) {
//             console.error('Get pending approvals error:', err.stack);
//             res.status(500).json({ error: 'Internal server error' });
//         }
//     }
// );

// PUT /api/approvals/reports/:reportId/approve - Approve a submitted report
// PUT /api/approvals/reports/:reportId/approve - Approve a report and advance the workflow
app.put(
    '/api/approvals/reports/:reportId/approve',
    authMiddleware,
    authorizeRole(['MANAGER', 'ADMIN']),
    async (req, res) => {
        const { reportId } = req.params;
        const approverId = req.user.userId;
        const { comments } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify this user is a pending approver for this report
            const approvalCheck = await client.query(
                'SELECT * FROM report_approvals WHERE report_id = $1 AND approver_id = $2 AND status = \'PENDING\'',
                [reportId, approverId]
            );
            if (approvalCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'No pending approval found for you on this report.' });
            }
            const currentApproval = approvalCheck.rows[0];

            // 2. Update the current approver's status to APPROVED
            await client.query(
                "UPDATE report_approvals SET status = 'APPROVED', comments = $1, action_at = NOW() WHERE approval_id = $2",
                [comments || null, currentApproval.approval_id]
            );
            
            // 3. Check for a custom workflow to decide the next step
            const report = (await client.query('SELECT employee_id FROM reports WHERE report_id = $1', [reportId])).rows[0];
            const workflow = (await client.query('SELECT * FROM approval_workflows WHERE applies_to_user_id = $1', [report.employee_id])).rows[0];

            let isReportFullyApproved = false;

            if (workflow) {
                // --- Custom Workflow Logic ---
                if (workflow.approval_mode === 'SEQUENTIAL') {
                    const nextApproverQuery = `
                        SELECT approver_id, step_order FROM workflow_approvers
                        WHERE workflow_id = $1 AND step_order > $2
                        ORDER BY step_order ASC LIMIT 1;
                    `;
                    const nextApprover = (await client.query(nextApproverQuery, [workflow.workflow_id, currentApproval.step_order])).rows[0];
                    
                    if (nextApprover) {
                        // Advance to the next approver
                        await client.query(
                            'INSERT INTO report_approvals (report_id, approver_id, status, step_order) VALUES ($1, $2, \'PENDING\', $3)',
                            [reportId, nextApprover.approver_id, nextApprover.step_order]
                        );
                    } else {
                        // No more approvers, the report is fully approved
                        isReportFullyApproved = true;
                    }
                } else { // PARALLEL
                    const statsQuery = `
                        SELECT
                            (SELECT COUNT(*) FROM workflow_approvers WHERE workflow_id = $1) AS total_approvers,
                            (SELECT COUNT(*) FROM report_approvals WHERE report_id = $2 AND status = 'APPROVED') AS approved_count;
                    `;
                    const stats = (await client.query(statsQuery, [workflow.workflow_id, reportId])).rows[0];
                    const approvalPercentage = (stats.approved_count / stats.total_approvers) * 100;

                    if (approvalPercentage >= workflow.min_approval_percentage) {
                        isReportFullyApproved = true;
                    }
                }
            } else {
                // --- Fallback Logic (Direct Manager) ---
                // If there's no custom workflow, one approval is enough.
                isReportFullyApproved = true;
            }

            // 4. If the report is fully approved, update the main reports table
            if (isReportFullyApproved) {
                await client.query(
                    "UPDATE reports SET status = 'APPROVED', last_action_at = NOW(), last_action_by_id = $1 WHERE report_id = $2",
                    [approverId, reportId]
                );
            }
            
            await client.query('COMMIT');
            res.json({ message: 'Approval recorded successfully.', report_approved: isReportFullyApproved });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Approve report error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);
// app.put(
//     '/api/approvals/reports/:reportId/approve',
//     authMiddleware,
//     authorizeRole(['MANAGER', 'ADMIN']),
//     async (req, res) => {
//         const { reportId } = req.params;
//         const managerId = req.user.userId;

//         const client = await pool.connect();
//         try {
//             await client.query('BEGIN');

//             // 1. Get the report and verify the manager is authorized to approve it
//             const reportQuery = `
//                 SELECT r.status FROM reports r
//                 JOIN users u ON r.employee_id = u.user_id
//                 WHERE r.report_id = $1 AND u.manager_id = $2
//             `;
//             const reportResult = await client.query(reportQuery, [reportId, managerId]);

//             if (reportResult.rows.length === 0) {
//                 await client.query('ROLLBACK');
//                 return res.status(404).json({ error: 'Report not found or you are not the designated approver.' });
//             }

//             if (reportResult.rows[0].status !== 'SUBMITTED') {
//                 await client.query('ROLLBACK');
//                 return res.status(400).json({ error: 'This report is not in a submitted state.' });
//             }

//             // 2. Update the report status
//             const updateQuery = `
//                 UPDATE reports
//                 SET status = 'APPROVED', last_action_at = NOW(), last_action_by_id = $1
//                 WHERE report_id = $2
//                 RETURNING *;
//             `;
//             const { rows } = await client.query(updateQuery, [managerId, reportId]);
            
//             await client.query('COMMIT');
//             res.json(rows[0]);

//         } catch (err) {
//             await client.query('ROLLBACK');
//             console.error('Approve report error:', err.stack);
//             res.status(500).json({ error: 'Internal server error' });
//         } finally {
//             client.release();
//         }
//     }
// );

// PUT /api/approvals/reports/:reportId/reject - Reject a submitted report
// PUT /api/approvals/reports/:reportId/reject - Reject a report and stop the workflow
app.put(
    '/api/approvals/reports/:reportId/reject',
    authMiddleware,
    authorizeRole(['MANAGER', 'ADMIN']),
    async (req, res) => {
        const { reportId } = req.params;
        const approverId = req.user.userId;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'A reason is required for rejection.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify this user is a pending approver for this report
            const approvalCheck = await client.query(
                'SELECT approval_id FROM report_approvals WHERE report_id = $1 AND approver_id = $2 AND status = \'PENDING\'',
                [reportId, approverId]
            );
            if (approvalCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'No pending approval found for you on this report.' });
            }

            // 2. Update the current approver's status to REJECTED
            await client.query(
                "UPDATE report_approvals SET status = 'REJECTED', comments = $1, action_at = NOW() WHERE approval_id = $2",
                [reason, approvalCheck.rows[0].approval_id]
            );

            // 3. Immediately update the main report's status to REJECTED
            await client.query(
                "UPDATE reports SET status = 'REJECTED', rejection_reason = $1, last_action_at = NOW(), last_action_by_id = $2 WHERE report_id = $3",
                [reason, approverId, reportId]
            );

            await client.query('COMMIT');
            res.json({ message: 'Report has been rejected.' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Reject report error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);
// app.put(
//     '/api/approvals/reports/:reportId/reject',
//     authMiddleware,
//     authorizeRole(['MANAGER', 'ADMIN']),
//     async (req, res) => {
//         const { reportId } = req.params;
//         const managerId = req.user.userId;
//         const { reason } = req.body; // Reason for rejection from the request body

//         if (!reason) {
//             return res.status(400).json({ error: 'A reason is required for rejection.' });
//         }
        
//         const client = await pool.connect();
//         try {
//             await client.query('BEGIN');

//             // 1. Get the report and verify the manager is authorized (same as approve)
//             const reportQuery = `
//                 SELECT r.status FROM reports r
//                 JOIN users u ON r.employee_id = u.user_id
//                 WHERE r.report_id = $1 AND u.manager_id = $2
//             `;
//             const reportResult = await client.query(reportQuery, [reportId, managerId]);

//             if (reportResult.rows.length === 0) {
//                 await client.query('ROLLBACK');
//                 return res.status(404).json({ error: 'Report not found or you are not the designated approver.' });
//             }

//             if (reportResult.rows[0].status !== 'SUBMITTED') {
//                 await client.query('ROLLBACK');
//                 return res.status(400).json({ error: 'This report is not in a submitted state.' });
//             }

//             // 2. Update the report status and add the rejection reason
//             const updateQuery = `
//                 UPDATE reports
//                 SET status = 'REJECTED', last_action_at = NOW(), last_action_by_id = $1, rejection_reason = $2
//                 WHERE report_id = $3
//                 RETURNING *;
//             `;
//             const { rows } = await client.query(updateQuery, [managerId, reason, reportId]);

//             await client.query('COMMIT');
//             res.json(rows[0]);

//         } catch (err) {
//             await client.query('ROLLBACK');
//             console.error('Reject report error:', err.stack);
//             res.status(500).json({ error: 'Internal server error' });
//         } finally {
//             client.release();
//         }
//     }
// );

// Admin
// POST /api/admin/users - Admin creates a new user
app.post(
    '/api/admin/users',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { firstName, lastName, email, role, managerId } = req.body;
        const { companyId } = req.user; // Admin's companyId from their token

        if (!firstName || !lastName || !email || !role) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        if (role === 'EMPLOYEE' && !managerId) {
            return res.status(400).json({ error: 'An employee must be assigned a manager.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Optional: Verify managerId belongs to the same company
            if (managerId) {
                const managerCheck = await client.query('SELECT company_id FROM users WHERE user_id = $1', [managerId]);
                if (managerCheck.rows.length === 0 || managerCheck.rows[0].company_id !== companyId) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Invalid manager ID.' });
                }
            }

            // Generate a secure temporary password
            const temporaryPassword = crypto.randomBytes(8).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(temporaryPassword, salt);

            // Insert the new user
            const newUserQuery = `
                INSERT INTO users (company_id, manager_id, first_name, last_name, email, password_hash, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING user_id, email, role, first_name, last_name;
            `;
            const { rows } = await client.query(newUserQuery, [
                companyId, managerId || null, firstName, lastName, email.toLowerCase(), passwordHash, role
            ]);
            
            await client.query('COMMIT');

            // Return the new user's details AND their temporary password to the Admin
            res.status(201).json({
                message: "User created successfully.",
                user: rows[0],
                temporaryPassword: temporaryPassword
            });

        } catch (err) {
            await client.query('ROLLBACK');
            if (err.code === '23505') { // Unique constraint violation for email
                return res.status(409).json({ error: 'A user with this email already exists.' });
            }
            console.error('Create user error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);

// GET /api/admin/users - Admin gets a list of all users in their company
app.get(
    '/api/admin/users',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { companyId } = req.user; // Get the Admin's companyId from their token

        try {
            const listUsersQuery = `
                SELECT
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.role,
                    u.manager_id,
                    m.first_name AS manager_first_name,
                    m.last_name AS manager_last_name
                FROM
                    users u
                LEFT JOIN
                    users m ON u.manager_id = m.user_id
                WHERE
                    u.company_id = $1
                ORDER BY
                    u.last_name, u.first_name;
            `;
            
            const { rows } = await pool.query(listUsersQuery, [companyId]);
            res.json(rows);

        } catch (err) {
            console.error('List users error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// PUT /api/admin/users/:userId - Admin updates a user's role or manager
app.put(
    '/api/admin/users/:userId',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { companyId } = req.user;
        const { userId: userToUpdateId } = req.params;
        const { role, managerId } = req.body;

        // Ensure at least one field is being updated
        if (!role && managerId === undefined) {
            return res.status(400).json({ error: 'No update fields provided (role, managerId).' });
        }
        // Prevent a user from being their own manager
        if (parseInt(userToUpdateId, 10) === managerId) {
            return res.status(400).json({ error: 'A user cannot be their own manager.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify the user to be updated belongs to the admin's company
            const userCheck = await client.query('SELECT role FROM users WHERE user_id = $1 AND company_id = $2', [userToUpdateId, companyId]);
            if (userCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found in your company.' });
            }
            const originalRole = userCheck.rows[0].role;

            // 2. Prevent demoting the last admin
            if (role && role !== 'ADMIN' && originalRole === 'ADMIN') {
                const adminCountQuery = 'SELECT COUNT(*) FROM users WHERE company_id = $1 AND role = \'ADMIN\'';
                const adminCountResult = await client.query(adminCountQuery, [companyId]);
                if (parseInt(adminCountResult.rows[0].count, 10) <= 1) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Cannot remove the last admin from the company.' });
                }
            }
            
            // 3. If managerId is being updated, verify the new manager is in the same company
            if (managerId) {
                const managerCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1 AND company_id = $2', [managerId, companyId]);
                if (managerCheck.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Invalid manager ID.' });
                }
            }
            
            // 4. Dynamically build the UPDATE query
            const updateFields = [];
            const queryParams = [userToUpdateId];

            if (role) {
                updateFields.push(`role = $${queryParams.length + 1}`);
                queryParams.push(role);
            }
            // Note: managerId can be null to unassign a manager
            if (managerId !== undefined) {
                updateFields.push(`manager_id = $${queryParams.length + 1}`);
                queryParams.push(managerId);
            }
            
            const updateQuery = `
                UPDATE users SET ${updateFields.join(', ')}
                WHERE user_id = $1 AND company_id = ${companyId}
                RETURNING user_id, email, role, manager_id;
            `;

            const { rows } = await client.query(updateQuery, queryParams);
            await client.query('COMMIT');
            res.json(rows[0]);

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Update user error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);

// DELETE /api/admin/users/:userId - Admin deactivates a user
app.delete(
    '/api/admin/users/:userId',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { companyId, userId: adminUserId } = req.user;
        const { userId: userToDeactivateId } = req.params;

        // Rule: An admin cannot deactivate themselves.
        if (parseInt(userToDeactivateId, 10) === adminUserId) {
            return res.status(400).json({ error: 'You cannot deactivate your own account.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify the user to be deactivated exists in the admin's company
            const userCheck = await client.query('SELECT role FROM users WHERE user_id = $1 AND company_id = $2', [userToDeactivateId, companyId]);
            if (userCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found in your company.' });
            }

            // 2. Rule: Prevent deactivating the last active admin
            if (userCheck.rows[0].role === 'ADMIN') {
                const adminCountQuery = 'SELECT COUNT(*) FROM users WHERE company_id = $1 AND role = \'ADMIN\' AND is_active = TRUE';
                const adminCountResult = await client.query(adminCountQuery, [companyId]);
                if (parseInt(adminCountResult.rows[0].count, 10) <= 1) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Cannot deactivate the last active admin.' });
                }
            }
            
            // 3. Deactivate the user
            const deactivateQuery = 'UPDATE users SET is_active = false WHERE user_id = $1';
            await client.query(deactivateQuery, [userToDeactivateId]);

            await client.query('COMMIT');
            res.status(200).json({ message: 'User deactivated successfully.' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Deactivate user error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);


// POST /api/admin/categories - Admin creates a new expense category
app.post(
    '/api/admin/categories',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { name, gl_code } = req.body;
        const { companyId } = req.user;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        try {
            const newCategoryQuery = `
                INSERT INTO expense_categories (company_id, name, gl_code)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const { rows } = await pool.query(newCategoryQuery, [companyId, name, gl_code || null]);
            res.status(201).json(rows[0]);

        } catch (err) {
            if (err.code === '23505') { // Handles the unique constraint we added
                return res.status(409).json({ error: `A category named "${name}" already exists.` });
            }
            console.error('Create category error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// GET /api/categories - Any authenticated user gets a list of their company's categories
app.get(
    '/api/categories',
    authMiddleware,
    async (req, res) => {
        const { companyId } = req.user;

        try {
            const getCategoriesQuery = 'SELECT * FROM expense_categories WHERE company_id = $1 ORDER BY name ASC';
            const { rows } = await pool.query(getCategoriesQuery, [companyId]);
            res.json(rows);
        } catch (err) {
            console.error('Get categories error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);


// PUT /api/admin/categories/:categoryId - Admin updates an expense category
app.put(
    '/api/admin/categories/:categoryId',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { categoryId } = req.params;
        const { companyId } = req.user;
        const { name, gl_code } = req.body;

        if (!name && !gl_code) {
            return res.status(400).json({ error: 'At least one field (name, gl_code) must be provided.' });
        }

        // Dynamically build the query
        const updateFields = [];
        const queryParams = [];
        let queryParamIndex = 1;

        if (name) {
            updateFields.push(`name = $${queryParamIndex++}`);
            queryParams.push(name);
        }
        if (gl_code) {
            updateFields.push(`gl_code = $${queryParamIndex++}`);
            queryParams.push(gl_code);
        }
        
        queryParams.push(categoryId, companyId);
        const finalQueryIndex = queryParamIndex;

        const updateQuery = `
            UPDATE expense_categories
            SET ${updateFields.join(', ')}
            WHERE category_id = $${finalQueryIndex} AND company_id = $${finalQueryIndex + 1}
            RETURNING *;
        `;
        
        try {
            const { rows } = await pool.query(updateQuery, queryParams);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Category not found or you do not have permission to edit it.' });
            }
            res.json(rows[0]);
        } catch (err) {
            if (err.code === '23505') { // Handles unique name constraint
                return res.status(409).json({ error: `A category named "${name}" already exists.` });
            }
            console.error('Update category error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// DELETE /api/admin/categories/:categoryId - Admin deletes an expense category
app.delete(
    '/api/admin/categories/:categoryId',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { categoryId } = req.params;
        const { companyId } = req.user;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Check if the category belongs to the admin's company before doing anything else
            const categoryCheck = await client.query('SELECT * FROM expense_categories WHERE category_id = $1 AND company_id = $2', [categoryId, companyId]);
            if (categoryCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Category not found.' });
            }

            // 2. Check if the category is currently in use by any expenses
            const usageCheck = await client.query('SELECT COUNT(*) FROM expenses WHERE category_id = $1', [categoryId]);
            if (parseInt(usageCheck.rows[0].count, 10) > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Cannot delete this category because it is currently in use by one or more expenses.' });
            }

            // 3. If not in use, proceed with deletion
            await client.query('DELETE FROM expense_categories WHERE category_id = $1', [categoryId]);
            
            await client.query('COMMIT');
            res.status(200).json({ message: 'Category deleted successfully.' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Delete category error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);


// POST /api/admin/workflows - Admin creates a new approval workflow
app.post(
    '/api/admin/workflows',
    authMiddleware,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        const { companyId } = req.user;
        const { name, approvalMode, minApprovalPercentage, appliesToUserId, approvers } = req.body;

        // Validation
        if (!name || !approvalMode || !approvers || approvers.length === 0) {
            return res.status(400).json({ error: 'Name, approvalMode, and at least one approver are required.' });
        }
        if (approvalMode === 'PARALLEL' && !minApprovalPercentage) {
            return res.status(400).json({ error: 'Minimum approval percentage is required for PARALLEL mode.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create the main workflow entry
            const workflowQuery = `
                INSERT INTO approval_workflows (company_id, name, approval_mode, min_approval_percentage, applies_to_user_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING workflow_id;
            `;
            const workflowResult = await client.query(workflowQuery, [companyId, name, approvalMode, minApprovalPercentage || null, appliesToUserId || null]);
            const newWorkflowId = workflowResult.rows[0].workflow_id;

            // 2. Insert all the approvers linked to this new workflow
            const approverInsertPromises = approvers.map(approver => {
                const approverQuery = `
                    INSERT INTO workflow_approvers (workflow_id, approver_id, step_order)
                    VALUES ($1, $2, $3);
                `;
                return client.query(approverQuery, [newWorkflowId, approver.userId, approver.step || null]);
            });
            
            await Promise.all(approverInsertPromises);

            await client.query('COMMIT');
            res.status(201).json({ message: 'Workflow created successfully.', workflowId: newWorkflowId });

        } catch (err) {
            await client.query('ROLLBACK');
            // Catch error if appliesToUserId is already assigned a workflow
            if (err.code === '23505' && err.constraint === 'approval_workflows_applies_to_user_id_key') {
                return res.status(409).json({ error: 'This user is already assigned to another workflow.' });
            }
            console.error('Create workflow error:', err.stack);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    }
);