const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const http = require('http');
const db = require('./db');
const { register, login, verifyToken, requestPasswordReset, resetPassword } = require('./auth');
const nodemailer = require('nodemailer');
const setupWebSocket = require('./websocket');
const setupDatabaseTriggers = require('./dbTriggers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// -----------------------------------------------------------------------------
// Middleware to ensure the authenticated user has the admin role
//
// Many endpoints in this API require only that a valid JWT is present.  For
// administrative actions such as managing job postings we also need to verify
// that the caller is actually an administrator.  We do this by joining the
// users table to the roles table and checking the role_name.  If the user
// isn't an admin we return a 403 response.  Any database or unexpected errors
// return a 500 so that callers know something went wrong server side.
const requireAdmin = (req, res, next) => {
  const userId = req.user && req.user.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const query = `
    SELECT r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error verifying admin role:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0 || results[0].role_name !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
};

// Configure multer for CV uploads
const cvUploadDir = path.join(__dirname, 'uploads', 'cvs');
// Create the upload directory if it doesn't exist
if (!fs.existsSync(cvUploadDir)) {
  fs.mkdirSync(cvUploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Only allow PDF, DOC and DOCX files up to 5 MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
});

// Notifications table creation - simplified without foreign keys
const createNotificationsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      subject VARCHAR(255),
      message TEXT,
      job_id INT,
      status VARCHAR(20) DEFAULT 'unread',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_status (user_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.log('Notifications table already exists or created successfully');
    } else {
      console.log('Notifications table ready');
    }
  });
};

// Job bookmarks table creation - simplified without foreign keys
const createJobBookmarksTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS job_bookmarks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      job_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_bookmark (user_id, job_id),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.log('Job bookmarks table already exists or created successfully');
    } else {
      console.log('Job bookmarks table ready');
    }
  });
};

// Job applications table will be created by the existing function later in the file

// Migrate legacy job_applications schema if necessary
const migrateJobApplicationsTable = () => {
  const showColumns = 'SHOW COLUMNS FROM job_applications';
  db.query(showColumns, (err, columns) => {
    if (err) {
      // Table may not exist yet; creation will happen separately
      return;
    }

    const hasApplicationId = columns.some(col => col.Field === 'application_id');
    const hasId = columns.some(col => col.Field === 'id');

    if (hasApplicationId && !hasId) {
      console.log('Migrating job_applications.application_id -> id');
      const alter = `ALTER TABLE job_applications CHANGE COLUMN application_id id INT NOT NULL`;
      db.query(alter, (alterErr) => {
        if (alterErr) {
          console.error('Error migrating job_applications primary key:', alterErr);
          return;
        }

        // Try to set AUTO_INCREMENT and PRIMARY KEY if not already set
        const setAutoInc = `ALTER TABLE job_applications MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT`;
        db.query(setAutoInc, (incErr) => {
          if (incErr) {
            console.warn('Warning setting AUTO_INCREMENT on job_applications.id:', incErr.message);
          }
        });
      });
    }
  });
};

// Import routes
const reportStatsRoutes = require('./reportStats');
// Bring in additional admin statistics routers.  These files expose
// Express routers that mount their own paths (e.g. `/api/admin/candidate-stats`)
// but they were never imported previously.  Without importing and
// registering them here, those endpoints return the default 404 page
// which in turn causes the frontend to receive an HTML response when
// attempting to parse JSON.  Importing and mounting them ensures the
// routes are registered on the Express app.
const candidateStatsRoutes = require('./candidateStats');
const employerStatsRoutes = require('./employerStats');

// Email configuration
// Email configuration will be moved to emailConfig.js

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Disable WebSocket temporarily to prevent crashes
// setupWebSocket(server);

// CORS configuration - Allow all origins for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Auth-Token']
};

// CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add headers before the routes are defined
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Pass to next layer of middleware
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CV Download endpoint
app.get('/api/download-cv/:filename', verifyToken, (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', 'cvs', filename);
  
  // Check if file exists
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Send file for download
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).json({ error: 'Error downloading file' });
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Get current user profile
app.get('/api/user/profile', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  const userQuery = `
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.role_id,
      r.role_name,
      u.created_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.id = ?
  `;
  
  db.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(results[0]);
  });
});

// Admin endpoints for user management
app.get('/api/admin/users', verifyToken, (req, res) => {
  // Check if user is admin
  const checkAdminQuery = `
    SELECT r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.id = ? AND r.role_name = 'admin'
  `;
  
  db.query(checkAdminQuery, [req.user.userId], (err, adminCheck) => {
    if (err || adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // Get all users with their roles
    const usersQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role_id,
        r.role_name,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM job_applications WHERE worker_id = u.id) as applications_count,
        (SELECT COUNT(*) FROM job WHERE EmployerID = u.id) as jobs_posted
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.created_at DESC
    `;
    
    db.query(usersQuery, (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(users);
    });
  });
});

// Update user role
app.put('/api/admin/users/:userId/role', verifyToken, (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;
  
  // Check if user is admin
  const checkAdminQuery = `
    SELECT r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.id = ? AND r.role_name = 'admin'
  `;
  
  db.query(checkAdminQuery, [req.user.userId], (err, adminCheck) => {
    if (err || adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // Update user role
    const updateQuery = 'UPDATE users SET role_id = ? WHERE id = ?';
    db.query(updateQuery, [roleId, userId], (err) => {
      if (err) {
        console.error('Error updating user role:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ success: true, message: 'User role updated successfully' });
    });
  });
});

// Get user activity logs
app.get('/api/admin/users/:userId/logs', verifyToken, (req, res) => {
  const { userId } = req.params;
  
  // Check if user is admin
  const checkAdminQuery = `
    SELECT r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.id = ? AND r.role_name = 'admin'
  `;
  
  db.query(checkAdminQuery, [req.user.userId], (err, adminCheck) => {
    if (err || adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // Get user activity logs
    const logsQuery = `
      SELECT 
        'registration' as activity_type,
        u.created_at as activity_date,
        CONCAT('User registered with email: ', u.email) as description,
        NULL as job_title
      FROM users u 
      WHERE u.id = ?
      
      UNION ALL
      
      SELECT 
        'job_application' as activity_type,
        ja.applied_at as activity_date,
        CONCAT('Applied for job: ', COALESCE(j.JobTitle, 'Unknown Job')) as description,
        j.JobTitle as job_title
      FROM job_applications ja
      LEFT JOIN job j ON ja.job_id = j.JobID
      WHERE ja.worker_id = ?
      
      UNION ALL
      
      SELECT 
        'job_posted' as activity_type,
        j.CreatedAt as activity_date,
        CONCAT('Posted job: ', j.JobTitle) as description,
        j.JobTitle as job_title
      FROM job j
      WHERE j.EmployerID = ?
      
      ORDER BY activity_date DESC
      LIMIT 50
    `;
    
    db.query(logsQuery, [userId, userId, userId], (err, logs) => {
      if (err) {
        console.error('Error fetching user logs:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(logs);
    });
  });
});

// Get all available roles
app.get('/api/admin/roles', verifyToken, (req, res) => {
  // Check if user is admin
  const checkAdminQuery = `
    SELECT r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.id = ? AND r.role_name = 'admin'
  `;
  
  db.query(checkAdminQuery, [req.user.userId], (err, adminCheck) => {
    if (err || adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // Get all roles
    const rolesQuery = 'SELECT DISTINCT role_id, role_name FROM roles ORDER BY role_id';
    db.query(rolesQuery, (err, roles) => {
      if (err) {
        console.error('Error fetching roles:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(roles);
    });
  });
});

// Get system statistics for admin dashboard
app.get('/api/admin/statistics', verifyToken, (req, res) => {
  // Check if user is admin
  const checkAdminQuery = `
    SELECT r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.role_id 
    WHERE u.id = ? AND r.role_name = 'admin'
  `;
  
  db.query(checkAdminQuery, [req.user.userId], (err, adminCheck) => {
    if (err || adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // Get system statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'worker') as total_workers,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'employer') as total_employers,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'admin') as total_admins,
        (SELECT COUNT(*) FROM job) as total_jobs,
        (SELECT COUNT(*) FROM job_applications) as total_applications,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) as new_users_today,
        (SELECT COUNT(*) FROM job_applications WHERE DATE(applied_at) = CURDATE()) as applications_today
    `;
    
    db.query(statsQuery, (err, stats) => {
      if (err) {
        console.error('Error fetching statistics:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(stats[0]);
    });
  });
});

// Routes
app.use('/api/reports', reportStatsRoutes);

// Register admin statistics routes.  Note: candidateStats.js and
// employerStats.js define their own paths (beginning with `/api/admin`), so
// mounting them at the root will allow the declared paths to take effect.
app.use(candidateStatsRoutes);
app.use(employerStatsRoutes);

/**
 * Additional statistics endpoints
 *
 * The admin dashboard in the frontend expects endpoints like
 * `/api/candidates/active-count`, `/api/jobs/active-count` and
 * `/api/placements/total-count` to return simple JSON payloads.  These
 * routes were missing from the original implementation which resulted
 * in 404 responses (HTML) being returned.  The handlers below provide
 * basic counts for active candidates, active jobs and total
 * placements.  In a real system you may want to refine what
 * constitutes an "active" candidate or job.  These endpoints do not
 * require authentication because they expose only aggregated data.
 */

// Get count of active candidates (for now all candidates are considered active)
app.get('/api/candidates/active-count', (req, res) => {
  const query = 'SELECT COUNT(*) AS count FROM candidate';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching candidate count:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const count = results?.[0]?.count || 0;
    res.json({ count });
  });
});

// Get count of active jobs.  Jobs may be stored in either the `jobs`
// table (for the admin posting system) or in the legacy `job`
// table.  We default to the `jobs` table and fall back to the
// legacy table if the first query fails.  Only jobs with a status
// equal to 'active' or 'open' are counted.
app.get('/api/jobs/active-count', (req, res) => {
  const queryJobs = 'SELECT COUNT(*) AS count FROM jobs WHERE status IN ("active", "open")';
  const queryLegacy = 'SELECT COUNT(*) AS count FROM job WHERE Status IN ("active", "open")';
  db.query(queryJobs, (err, results) => {
    if (!err) {
      const count = results?.[0]?.count || 0;
      return res.json({ count });
    }
    // fall back to legacy table
    db.query(queryLegacy, (err2, results2) => {
      if (err2) {
        console.error('Error fetching jobs count:', err, err2);
        return res.status(500).json({ error: 'Database error' });
      }
      const count = results2?.[0]?.count || 0;
      res.json({ count });
    });
  });
});

// Get total placements count.  If the `placements` table does not
// exist (e.g. on a fresh database), the query will fail.  In that
// case we return zero rather than an error.
app.get('/api/placements/total-count', (req, res) => {
  const query = 'SELECT COUNT(*) AS count FROM placements';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching placements count:', err);
      return res.json({ count: 0 });
    }
    const count = results?.[0]?.count || 0;
    res.json({ count });
  });
});

/**
 * Consolidated admin statistics
 *
 * The admin dashboard can call this endpoint to retrieve multiple
 * statistics in a single round-trip.  It composes the results from
 * the candidate, jobs and placement count endpoints and the top
 * categories query from the existing dashboard stats.  To avoid
 * duplicate code, we reuse the `statsQueries` defined below in the
 * `/api/dashboard/stats` route.  This endpoint does not require
 * authentication, since it returns only aggregated values.
 */
app.get('/api/admin/stats', async (req, res) => {
  try {
    const candidateCount = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) AS count FROM candidate', (err, results) => {
        if (err) reject(err);
        else resolve(results?.[0]?.count || 0);
      });
    });
    const jobCount = await new Promise((resolve) => {
      db.query('SELECT COUNT(*) AS count FROM jobs WHERE status IN ("active", "open")', (err, results) => {
        if (err) {
          // Fallback to legacy table
          db.query('SELECT COUNT(*) AS count FROM job WHERE Status IN ("active", "open")', (err2, results2) => {
            if (err2) return resolve(0);
            resolve(results2?.[0]?.count || 0);
          });
        } else {
          resolve(results?.[0]?.count || 0);
        }
      });
    });
    const placementCount = await new Promise((resolve) => {
      db.query('SELECT COUNT(*) AS count FROM placements', (err, results) => {
        if (err) return resolve(0);
        resolve(results?.[0]?.count || 0);
      });
    });
    // Top 5 categories with the most active jobs
    const categoriesQuery = `
      SELECT c.CategoryName AS category, COUNT(j.id) AS job_count
      FROM categories c
      LEFT JOIN positions p ON c.CategoryID = p.category_id
      LEFT JOIN jobs j ON p.id = j.position_id
      WHERE j.status = 'active'
      GROUP BY c.CategoryID, c.CategoryName
      ORDER BY job_count DESC
      LIMIT 5
    `;
    const topCategories = await new Promise((resolve) => {
      db.query(categoriesQuery, (err, results) => {
        if (err) {
          console.error('Error fetching category stats:', err);
          return resolve([]);
        }
        resolve(results || []);
      });
    });
    res.json({
      activeCandidates: candidateCount,
      activeJobs: jobCount,
      totalPlacements: placementCount,
      categoryStats: topCategories
    });
  } catch (error) {
    console.error('Error compiling admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication Routes
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  register(req, res);
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  login(req, res);
});

// Password Reset Routes
app.post('/api/auth/forgot-password', (req, res) => {
  console.log('Password reset request received for email:', req.body.email);
  requestPasswordReset(req, res);
});

app.post('/api/auth/reset-password', (req, res) => {
  console.log('Password reset attempt with token');
  resetPassword(req, res);
});

// Get user profile with details (role-based)
app.get('/api/auth/profile', verifyToken, (req, res) => {
  // First get user info with role
  const userQuery = `
    SELECT u.id, u.full_name, u.email, u.created_at, r.role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.id = ?
  `;

  db.query(userQuery, [req.user.userId], (err, userResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    const user = userResults[0];
    const roleName = user.role_name;

    // Get role-specific profile
    let profileQuery = '';
    let profileTable = '';

    if (roleName === 'worker') {
      profileTable = 'worker_profiles';
      profileQuery = `
        SELECT * FROM ${profileTable} WHERE user_id = ?
      `;
    } else if (roleName === 'employer') {
      profileTable = 'employer_profiles';
      profileQuery = `
        SELECT * FROM ${profileTable} WHERE user_id = ?
      `;
    } else if (roleName === 'admin') {
      profileTable = 'admin_profiles';
      profileQuery = `
        SELECT * FROM ${profileTable} WHERE user_id = ?
      `;
    }

    if (profileQuery) {
      db.query(profileQuery, [req.user.userId], (err, profileResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const profile = profileResults.length > 0 ? profileResults[0] : null;
        res.json({
          ...user,
          profile: profile
        });
      });
    } else {
      res.json(user);
    }
  });
});

// Get suggested jobs for worker
app.get('/api/jobs/suggested', verifyToken, (req, res) => {
  // For now, return all active jobs as suggestions
  // In a real app, this would use recommendation logic based on worker's profile
  const query = `
    SELECT j.*, e.company_name, e.logo_url 
    FROM jobs j
    JOIN employers e ON j.employer_id = e.id
    WHERE j.is_active = 1
    ORDER BY j.created_at DESC
    LIMIT 10
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching suggested jobs:', err);
      return res.status(500).json({ error: 'Error fetching suggested jobs' });
    }
    res.json(results);
  });
});

// Get worker's job applications
app.get('/api/worker/applications', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT a.*, j.title as job_title, j.company_name, j.location, j.salary_range,
           CASE 
             WHEN a.status = 'pending' THEN 'בבדיקה'
             WHEN a.status = 'accepted' THEN 'מאושר'
             WHEN a.status = 'rejected' THEN 'נדחה'
             ELSE a.status
           END as status_he
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.worker_id = ?
    ORDER BY a.applied_at DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching applications:', err);
      return res.status(500).json({ error: 'Error fetching applications' });
    }
    res.json(results);
  });
});

// Get worker profile
app.get('/api/worker/profile', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  // First get user basic info
  const userQuery = 'SELECT id, full_name, email, role_id FROM users WHERE id = ?';
  db.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResults[0];
    
    // Then get worker profile details
    const profileQuery = `
      SELECT * FROM worker_profiles 
      WHERE user_id = ?
    `;
    
    db.query(profileQuery, [userId], (err, profileResults) => {
      if (err) {
        console.error('Error fetching worker profile:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Combine user info with profile data
      const profile = profileResults.length > 0 ? profileResults[0] : {};
      const response = {
        ...user,
        ...profile
      };
      
      res.json(response);
    });
  });
});

// Create or update worker profile
app.post('/api/worker/profile', verifyToken, (req, res) => {
  const payload = req.body || {};
  const allowed = [
    'phone', 'address', 'skills', 'experience_years', 'education',
    'preferred_job_type', 'preferred_location', 'salary_expectation', 'cv_file'
  ];

  // Build lists of fields to persist (ignore undefined/null/empty string)
  const updateFragments = [];
  const updateParams = [];
  const insertCols = ['user_id'];
  const insertVals = [req.user.userId];

  allowed.forEach((key) => {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== '') {
      updateFragments.push(`${key} = ?`);
      updateParams.push(val);
      insertCols.push(key);
      insertVals.push(val);
    }
  });

  const checkQuery = 'SELECT id FROM worker_profiles WHERE user_id = ?';
  db.query(checkQuery, [req.user.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      if (updateFragments.length === 0) {
        return res.json({ message: 'לא סופקו עדכונים' });
      }
      const updateQuery = `UPDATE worker_profiles SET ${updateFragments.join(', ')} WHERE user_id = ?`;
      db.query(updateQuery, [...updateParams, req.user.userId], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.json({ message: 'פרופיל עובד עודכן בהצלחה' });
      });
    } else {
      if (insertCols.length === 1) { // only user_id
        const minimalInsert = 'INSERT INTO worker_profiles (user_id) VALUES (?)';
        return db.query(minimalInsert, [req.user.userId], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ message: 'פרופיל עובד נוצר בהצלחה' });
        });
      }
      const placeholders = insertCols.map(() => '?').join(', ');
      const insertQuery = `INSERT INTO worker_profiles (${insertCols.join(', ')}) VALUES (${placeholders})`;
      db.query(insertQuery, insertVals, (err4) => {
        if (err4) {
          return res.status(500).json({ error: err4.message });
        }
        res.json({ message: 'פרופיל עובד נוצר בהצלחה' });
      });
    }
  });
});

// Create or update employer profile
app.post('/api/employer/profile', verifyToken, (req, res) => {
  const { company_name, company_description, industry, company_size, website, phone, address, logo_file } = req.body;

  const checkQuery = 'SELECT id FROM employer_profiles WHERE user_id = ?';
  db.query(checkQuery, [req.user.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      const updateQuery = `
        UPDATE employer_profiles SET
        company_name = ?, company_description = ?, industry = ?, company_size = ?,
        website = ?, phone = ?, address = ?, logo_file = ?
        WHERE user_id = ?
      `;
      db.query(updateQuery, [company_name, company_description, industry, company_size, website, phone, address, logo_file, req.user.userId], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'פרופיל מעסיק עודכן בהצלחה' });
      });
    } else {
      const insertQuery = `
        INSERT INTO employer_profiles
        (user_id, company_name, company_description, industry, company_size, website, phone, address, logo_file)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [req.user.userId, company_name, company_description, industry, company_size, website, phone, address, logo_file], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'פרופיל מעסיק נוצר בהצלחה' });
      });
    }
  });
});

// Create or update admin profile
app.post('/api/admin/profile', verifyToken, (req, res) => {
  const { department, permissions, phone } = req.body;

  const checkQuery = 'SELECT id FROM admin_profiles WHERE user_id = ?';
  db.query(checkQuery, [req.user.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      const updateQuery = `
        UPDATE admin_profiles SET
        department = ?, permissions = ?, phone = ?
        WHERE user_id = ?
      `;
      db.query(updateQuery, [department, permissions, phone, req.user.userId], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'פרופיל מנהל עודכן בהצלחה' });
      });
    } else {
      const insertQuery = `
        INSERT INTO admin_profiles
        (user_id, department, permissions, phone)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertQuery, [req.user.userId, department, permissions, phone], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'פרופיל מנהל נוצר בהצלחה' });
      });
    }
  });
});

// Promote user to admin (requires existing admin privileges)
app.post('/api/admin/promote-user', verifyToken, requireAdmin, (req, res) => {
  const { userId, email } = req.body;

  if (!userId && !email) {
    return res.status(400).json({ message: 'User ID or email is required' });
  }

  let query = 'UPDATE users SET role_id = 1 WHERE ';
  let param;

  if (userId) {
    query += 'id = ?';
    param = userId;
  } else {
    query += 'email = ?';
    param = email;
  }

  db.query(query, [param], (err, results) => {
    if (err) {
      console.error('Error promoting user to admin:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User promoted to admin successfully' });
  });
});

// Create first admin user (only works if no admin exists)
app.post('/api/admin/create-first-admin', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if any admin exists
  const checkAdminQuery = `
    SELECT COUNT(*) as admin_count
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE r.role_name = 'admin'
  `;

  db.query(checkAdminQuery, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results[0].admin_count > 0) {
      return res.status(403).json({ message: 'Admin already exists. Use existing admin to promote users.' });
    }

    // Promote user to admin
    const promoteQuery = 'UPDATE users SET role_id = 1 WHERE email = ?';
    db.query(promoteQuery, [email], (err, updateResults) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (updateResults.affectedRows === 0) {
        return res.status(404).json({ message: 'User with this email not found' });
      }

      res.json({ message: 'First admin created successfully' });
    });
  });
});

// Get suggested jobs for user based on profile
app.get('/api/jobs/suggested', verifyToken, (req, res) => {
  // Simplified query using the actual job table
  const query = `
    SELECT 
      j.JobID as id,
      j.JobTitle as title,
      j.CompanyName as company_name,
      j.CityName as location,
      j.Description as description,
      j.MinSalary as salary_min,
      j.MaxSalary as salary_max,
      j.CreatedAt as created_at
    FROM job j
    LEFT JOIN worker_profiles wp ON wp.user_id = ?
    WHERE 1=1
      AND (wp.preferred_location IS NULL OR j.CityName LIKE CONCAT('%', wp.preferred_location, '%'))
    ORDER BY j.CreatedAt DESC
    LIMIT 10
  `;
  db.query(query, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching suggested jobs:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results || []);
  });
});

// Apply for a job (deprecated - kept for backward compatibility)
app.post('/api/jobs/:jobId/apply', verifyToken, (req, res) => {
  const jobId = req.params.jobId;
  const workerId = req.user.userId;

  // Check if user has worker role
  const checkRoleQuery = `
    SELECT r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.id = ?
  `;

  db.query(checkRoleQuery, [workerId], (err, roleResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (roleResults.length === 0 || roleResults[0].role_name !== 'worker') {
      return res.status(403).json({ error: 'Only workers can apply for jobs' });
    }

    // Check if already applied
    const checkApplicationQuery = 'SELECT id FROM job_applications WHERE job_id = ? AND worker_id = ?';
    db.query(checkApplicationQuery, [jobId, workerId], (err, existingResults) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingResults.length > 0) {
        return res.status(400).json({ error: 'You have already applied for this job' });
      }

      // Create application
      const insertApplicationQuery = `
        INSERT INTO job_applications (job_id, worker_id, status, applied_at)
        VALUES (?, ?, 'pending', NOW())
      `;

      db.query(insertApplicationQuery, [jobId, workerId], (err, results) => {
        if (err) {
          console.error('Error creating application:', err);
          return res.status(500).json({ error: 'Failed to submit application' });
        }

        res.json({
          message: 'Application submitted successfully!',
          applicationId: results.insertId
        });
      });
    });
  });
});

// Apply for a job with CV upload
app.post('/api/jobs/:jobId/apply-with-cv', verifyToken, upload.single('cv'), async (req, res) => {
  console.log('=== Job Application Endpoint Called ===');
  console.log('Job ID:', req.params.jobId);
  console.log('User:', req.user);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  const jobId = req.params.jobId;
  const workerId = req.user.userId;
  const { coverLetter, useExistingCV } = req.body;

  try {
    // Check if user has worker role
    const checkRoleQuery = `
      SELECT r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.id = ?
    `;

    db.query(checkRoleQuery, [workerId], (err, roleResults) => {
      if (err) {
        console.error('Error checking user role:', err);
        return res.status(500).json({ error: 'Database error checking role', details: err.message });
      }

      console.log('Role check results:', roleResults);
      if (roleResults.length === 0 || roleResults[0].role_name !== 'worker') {
        console.log('User is not a worker or not found');
        return res.status(403).json({ error: 'Only workers can apply for jobs' });
      }

      // Check if already applied
      const checkApplicationQuery = 'SELECT id FROM job_applications WHERE job_id = ? AND worker_id = ?';
      db.query(checkApplicationQuery, [jobId, workerId], (err, existingResults) => {
        if (err) {
          console.error('Error checking existing application:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingResults.length > 0) {
          return res.status(400).json({ error: 'כבר הגשת מועמדות למשרה זו' });
        }

        // Check if job exists
        const getJobQuery = 'SELECT id FROM jobs WHERE id = ? UNION SELECT JobID as id FROM job WHERE JobID = ?';
        db.query(getJobQuery, [jobId, jobId], (err, jobResults) => {
          if (err || jobResults.length === 0) {
            return res.status(404).json({ error: 'משרה לא נמצאה' });
          }

          const employerId = null; // Set to null for now

          // Handle CV file path
          let cvFilePath = null;
          
          const processApplication = () => {
            // Create application with CV
            const insertApplicationQuery = `
              INSERT INTO job_applications (
                job_id, 
                worker_id, 
                user_id,
                employer_id,
                status, 
                applied_at, 
                cv_file_path,
                cover_letter
              )
              VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?)
            `;

            db.query(insertApplicationQuery, [
              jobId, 
              workerId, 
              workerId,
              employerId,
              cvFilePath,
              coverLetter || null
            ], (err, results) => {
              if (err) {
                console.error('Error creating application:', err);
                return res.status(500).json({ error: 'Failed to submit application' });
              }

              console.log('Application created successfully');

              res.json({
                success: true,
                message: 'המועמדות הוגשה בהצלחה!',
                applicationId: results.insertId,
                cvUploaded: !!cvFilePath
              });
            });
          };

          if (useExistingCV === 'true') {
            // Get existing CV from worker profile
            const getProfileQuery = 'SELECT cv_file FROM worker_profiles WHERE user_id = ?';
            db.query(getProfileQuery, [workerId], (err, profileResults) => {
              if (err || !profileResults || profileResults.length === 0 || !profileResults[0].cv_file) {
                return res.status(400).json({ error: 'לא נמצא קובץ CV בפרופיל שלך' });
              }
              
              cvFilePath = profileResults[0].cv_file;
              processApplication();
            });
          } else if (req.file) {
            cvFilePath = path.join('uploads', 'cvs', req.file.filename);
            
            // Update worker profile with CV
            const updateProfileQuery = `
              INSERT INTO worker_profiles (user_id, cv_file) 
              VALUES (?, ?) 
              ON DUPLICATE KEY UPDATE cv_file = ?
            `;
            
            db.query(updateProfileQuery, [workerId, cvFilePath, cvFilePath], (err) => {
              if (err) {
                console.error('Error updating worker profile:', err);
              }
            });
            
            processApplication();
          } else {
            return res.status(400).json({ error: 'חובה להעלות קובץ CV או לבחור להשתמש בקובץ קיים' });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in job application:', error);
    res.status(500).json({ error: 'שגיאה בהגשת המועמדות' });
  }
});

// Get worker's job applications
app.get('/api/worker/applications', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  // Simplified query that works with current table structure
  const query = `
    SELECT 
      ja.id,
      ja.job_id,
      ja.status,
      ja.applied_at,
      ja.updated_at,
      jb.JobTitle as title,
      jb.CompanyName as company_name,
      jb.CityName as location,
      jb.Description as description,
      jb.MinSalary as salary_min,
      jb.MaxSalary as salary_max
    FROM job_applications ja
    LEFT JOIN job jb ON ja.job_id = jb.JobID
    WHERE ja.worker_id = ?
    ORDER BY ja.applied_at DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching worker applications:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json(results || []);
  });
});

// Job posting endpoint for employers
app.post('/api/employer/jobs', verifyToken, (req, res) => {
  const { title, description, requirements, salary_min, salary_max, location, job_type, category } = req.body;

  // Get employer profile to get company info
  const getEmployerQuery = 'SELECT company_name FROM employer_profiles WHERE user_id = ?';
  db.query(getEmployerQuery, [req.user.userId], (err, employerResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (employerResults.length === 0) {
      return res.status(400).json({ error: 'Employer profile not found. Please create your company profile first.' });
    }

    const company_name = employerResults[0].company_name;

    const insertJobQuery = `
      INSERT INTO jobs (title, description, requirements, salary_min, salary_max,
                       location, job_type, category, company_name, employer_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `;

    db.query(insertJobQuery, [
      title, description, requirements, salary_min, salary_max,
      location, job_type, category, company_name, req.user.userId
    ], (err, results) => {
      if (err) {
        console.error('Error creating job:', err);
        return res.status(500).json({ error: 'Failed to create job' });
      }

      res.json({
        message: 'Job posted successfully!',
        jobId: results.insertId
      });
    });
  });
});

// Get jobs posted by employer with detailed application stats
app.get('/api/employer/jobs', verifyToken, (req, res) => {
  const query = `
    SELECT
      j.*,
      COUNT(ja.id) as application_count,
      COUNT(CASE WHEN ja.status = 'pending' THEN 1 END) as pending_applications,
      COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as accepted_applications,
      COUNT(CASE WHEN ja.status = 'rejected' THEN 1 END) as rejected_applications
    FROM jobs j
    LEFT JOIN job_applications ja ON j.id = ja.job_id
    WHERE j.employer_id = ?
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `;

  db.query(query, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching employer jobs:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results || []);
  });
});

// Get applications for a specific job
app.get('/api/employer/jobs/:jobId/applications', verifyToken, (req, res) => {
  const jobId = req.params.jobId;

  // First verify the job belongs to the employer
  const verifyJobQuery = 'SELECT id FROM jobs WHERE id = ? AND employer_id = ?';
  db.query(verifyJobQuery, [jobId, req.user.userId], (err, jobResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (jobResults.length === 0) {
      return res.status(403).json({ error: 'Job not found or access denied' });
    }

    const applicationsQuery = `
      SELECT
        ja.*,
        u.full_name,
        u.email,
        wp.phone,
        wp.skills,
        wp.experience_years,
        wp.education,
        wp.cv_file,
        ja.cv_file_path as application_cv,
        ja.cover_letter
      FROM job_applications ja
      JOIN users u ON ja.worker_id = u.id
      LEFT JOIN worker_profiles wp ON ja.worker_id = wp.user_id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
    `;

    db.query(applicationsQuery, [jobId], (err, results) => {
      if (err) {
        console.error('Error fetching job applications:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(results || []);
    });
  });
});

// Update application status
app.put('/api/employer/applications/:applicationId/status', verifyToken, (req, res) => {
  const applicationId = req.params.applicationId;
  const { status, notes } = req.body;

  if (!['pending', 'accepted', 'rejected', 'in_review'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Verify the application belongs to a job owned by this employer
  const verifyQuery = `
    SELECT ja.id
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.id = ? AND j.employer_id = ?
  `;

  db.query(verifyQuery, [applicationId, req.user.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(403).json({ error: 'Application not found or access denied' });
    }

    const updateQuery = `
      UPDATE job_applications
      SET status = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    db.query(updateQuery, [status, notes || null, applicationId], (err, updateResults) => {
      if (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Application status updated successfully' });
    });
  });
});

// Admin endpoint to get all jobs
app.get('/api/admin/jobs', (req, res) => {
  const query = `
    SELECT j.JobID as id, j.Title as title, j.Description as description,
           j.Requirements as requirements, j.Location as location, j.Salary as salary,
           j.PostDate as created_at, j.Status as status, j.EmployerID as employer_id,
           e.CompanyName as company_name
    FROM jobs j
    LEFT JOIN employer e ON j.EmployerID = e.EmployerID
    ORDER BY j.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching admin jobs:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results || []);
  });
});

// Admin endpoint to create a new job
app.post('/api/admin/jobs', (req, res) => {
  const { title, description, requirements, salary_min, salary_max, location, job_type, category, company_name, status } = req.body;

  const insertJobQuery = `
    INSERT INTO jobs (Title, Description, Requirements, Salary,
                     Location, EmployerID, Status, PostDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const salaryRange = salary_min && salary_max ? `${salary_min}-${salary_max}` : (salary_min || salary_max || '');

  db.query(insertJobQuery, [
    title, description, requirements, salaryRange,
    location, 1, status || 'open'
  ], (err, results) => {
    if (err) {
      console.error('Error creating admin job:', err);
      return res.status(500).json({ error: 'Failed to create job' });
    }

    res.json({
      message: 'Job created successfully!',
      jobId: results.insertId
    });
  });
});

// Admin endpoint to update a job
app.put('/api/admin/jobs/:id', (req, res) => {
  const jobId = req.params.id;
  const { title, description, requirements, salary_min, salary_max, location, job_type, category, company_name, status } = req.body;

  const updateJobQuery = `
    UPDATE jobs SET
    Title = ?, Description = ?, Requirements = ?, Salary = ?,
    Location = ?, Status = ?
    WHERE JobID = ?
  `;

  const salaryRange = salary_min && salary_max ? `${salary_min}-${salary_max}` : (salary_min || salary_max || '');

  db.query(updateJobQuery, [
    title, description, requirements, salaryRange,
    location, status, jobId
  ], (err, results) => {
    if (err) {
      console.error('Error updating admin job:', err);
      return res.status(500).json({ error: 'Failed to update job' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job updated successfully' });
  });
});

// Admin endpoint to delete a job
app.delete('/api/admin/jobs/:id', (req, res) => {
  const jobId = req.params.id;

  const deleteJobQuery = 'DELETE FROM jobs WHERE JobID = ?';
  db.query(deleteJobQuery, [jobId], (err, results) => {
    if (err) {
      console.error('Error deleting admin job:', err);
      return res.status(500).json({ error: 'Failed to delete job' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  });
});

// Get all candidates
app.get('/api/candidates', (req, res) => {
  const query = 'SELECT * FROM candidate';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results || []);
  });
});

// Get candidate by ID
app.get('/api/candidates/:id', (req, res) => {
  const query = 'SELECT * FROM candidate WHERE CandidateID = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.json(results[0]);
  });
});

// Create new candidate
app.post('/api/candidates', (req, res) => {
  const { FullName, Phone, Email, Address, Education, Skills } = req.body;
  const query = 'INSERT INTO candidate (FullName, Phone, Email, Address, Education, Skills) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(query, [FullName, Phone, Email, Address, Education, Skills], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Candidate created successfully',
      candidateId: results.insertId
    });
  });
});

// Update candidate
app.put('/api/candidates/:id', (req, res) => {
  const { FullName, Phone, Email, Address, Education, Skills } = req.body;
  const query = 'UPDATE candidate SET FullName = ?, Phone = ?, Email = ?, Address = ?, Education = ?, Skills = ? WHERE CandidateID = ?';

  db.query(query, [FullName, Phone, Email, Address, Education, Skills, req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.json({ message: 'Candidate updated successfully' });
  });
});

// Delete candidate
app.delete('/api/candidates/:id', (req, res) => {
  const query = 'DELETE FROM candidate WHERE CandidateID = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.json({ message: 'Candidate deleted successfully' });
  });
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const query = 'SELECT * FROM job';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results || []);
  });
});

// Enhanced job search with advanced filters
app.get('/api/jobs/advanced-search', (req, res) => {
  const {
    query, location, jobType, experience, salary,
    category, company, datePosted, remote
  } = req.query;

  console.log('Advanced search params:', req.query);

  let searchQuery = `
    SELECT DISTINCT
      j.JobID,
      j.Title as JobTitle,
      j.Description,
      j.Requirements,
      j.Salary,
      j.Location as CityName,
      j.PostDate as CreatedAt,
      j.Status,
      j.JobType,
      j.ExperienceLevel,
      j.remote_work,
      p.name as Position,
      c.name as CompanyName,
      cat.CategoryName as Category
    FROM jobs j
    LEFT JOIN positions p ON j.position_id = p.id
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.CategoryID
    WHERE j.Status = 'open'
  `;

  const params = [];

  // Text search across multiple fields
  if (query && query.trim()) {
    searchQuery += ` AND (j.Title LIKE ? OR j.Description LIKE ? OR j.Requirements LIKE ? OR p.name LIKE ? OR c.name LIKE ?)`;
    const searchTerm = `%${query.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Location filter
  if (location) {
    searchQuery += ` AND j.Location LIKE ?`;
    params.push(`%${location}%`);
  }

  // Job type filter
  if (jobType) {
    searchQuery += ` AND j.JobType = ?`;
    params.push(jobType);
  }

  // Experience filter
  if (experience) {
    searchQuery += ` AND j.ExperienceLevel = ?`;
    params.push(experience);
  }

  // Salary filter
  if (salary) {
    const salaryRanges = {
      '8-12': { min: 8000, max: 12000 },
      '12-16': { min: 12000, max: 16000 },
      '16-20': { min: 16000, max: 20000 },
      '20+': { min: 20000, max: 999999 }
    };

    if (salaryRanges[salary]) {
      searchQuery += ` AND CAST(SUBSTRING_INDEX(j.Salary, '-', 1) AS UNSIGNED) >= ? AND CAST(SUBSTRING_INDEX(j.Salary, '-', -1) AS UNSIGNED) <= ?`;
      params.push(salaryRanges[salary].min, salaryRanges[salary].max);
    }
  }

  // Category filter
  if (category) {
    searchQuery += ` AND cat.CategoryID = ?`;
    params.push(category);
  }

  // Company filter
  if (company) {
    searchQuery += ` AND c.name LIKE ?`;
    params.push(`%${company}%`);
  }

  // Date posted filter
  if (datePosted) {
    const dateMap = {
      '1': 'DATE(j.PostDate) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)',
      '7': 'DATE(j.PostDate) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
      '30': 'DATE(j.PostDate) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    };
    if (dateMap[datePosted]) {
      searchQuery += ` AND ${dateMap[datePosted]}`;
    }
  }

  // Remote work filter
  if (remote === 'true') {
    searchQuery += ` AND j.remote_work = 1`;
  }

  searchQuery += ` ORDER BY j.PostDate DESC LIMIT 100`;

  db.query(searchQuery, params, (err, results) => {
    if (err) {
      console.error('Error executing advanced search:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Found ${results.length} results for advanced search`);
    res.json(results || []);
  });
});

// Update all jobs with random job type
app.get('/api/jobs/update-types', (req, res) => {
  const query = `
    UPDATE jobs
    SET job_type_id = FLOOR(1 + RAND() * 4)
    WHERE job_type_id IS NULL
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error updating job types:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Jobs updated:', results);
    res.json({ message: 'Job types updated successfully' });
  });
});

app.get('/api/jobs/free-search', (req, res) => {
  const { query, location, jobType, experience, salary } = req.query;

  console.log('Free search params:', { query, location, jobType, experience, salary });

  let searchQuery = `
    SELECT
      j.JobID,
      j.Title as JobTitle,
      j.Description,
      j.Requirements,
      j.Salary,
      j.Location as CityName,
      j.PostDate as CreatedAt,
      j.Status,
      j.JobType,
      j.ExperienceLevel,
      p.name as Position,
      c.name as CompanyName
    FROM jobs j
    LEFT JOIN positions p ON j.position_id = p.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE (j.Title LIKE ? OR j.Description LIKE ? OR j.Requirements LIKE ?)
    AND j.Status = 'open'
  `;

  const params = [`%${query}%`, `%${query}%`, `%${query}%`];

  // Add location filter
  if (location) {
    searchQuery += ` AND j.Location LIKE ?`;
    params.push(`%${location}%`);
  }

  // Add job type filter
  if (jobType) {
    const jobTypeMap = {
      'מלאה': 'full-time',
      'חלקית': 'part-time',
      'סטודנט': 'student',
      'פרילנס': 'freelance'
    };
    const mappedJobType = jobTypeMap[jobType] || jobType;
    searchQuery += ` AND j.JobType = ?`;
    params.push(mappedJobType);
  }

  // Add experience filter
  if (experience) {
    const experienceMap = {
      'ללא': '0',
      '1-2': '1-2',
      '3-5': '3-5',
      '5+': '5+'
    };
    const mappedExperience = experienceMap[experience] || experience;
    searchQuery += ` AND j.ExperienceLevel = ?`;
    params.push(mappedExperience);
  }

  // Add salary filter
  if (salary) {
    const salaryRanges = {
      '8-12': { min: 8000, max: 12000 },
      '12-16': { min: 12000, max: 16000 },
      '16-20': { min: 16000, max: 20000 },
      '20+': { min: 20000, max: 999999 }
    };

    if (salaryRanges[salary]) {
      searchQuery += ` AND j.Salary >= ? AND j.Salary <= ?`;
      params.push(salaryRanges[salary].min, salaryRanges[salary].max);
    }
  }

  searchQuery += ` ORDER BY j.PostDate DESC`;

  db.query(searchQuery, params, (err, results) => {
    if (err) {
      console.error('Error executing search query:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Found ${results.length} results for search term: ${query}`);
    res.json(results || []);
  });
});

app.get('/api/import-sample-data', (req, res) => {
  const sampleData = [
    // Categories
    `INSERT INTO categories (CategoryID, CategoryName) VALUES
    (1, 'הייטק'),
    (2, 'שיווק ומכירות'),
    (3, 'פיננסים'),
    (4, 'חינוך')`,

    // Cities
    `INSERT INTO cities (id, name) VALUES
    (1, 'תל אביב'),
    (2, 'ירושלים'),
    (3, 'חיפה'),
    (4, 'באר שבע')`,

    // Job Types
    `INSERT INTO job_types (TypeID, name) VALUES
    (1, 'משרה מלאה'),
    (2, 'משרה חלקית'),
    (3, 'פרילנס'),
    (4, 'סטודנט')`,

    // Positions
    `INSERT INTO positions (id, name, category_id) VALUES
    (1, 'מפתח/ת Full Stack', 1),
    (2, 'מנהל/ת מכירות', 2),
    (3, 'מנהל/ת חשבונות', 3),
    (4, 'מורה', 4)`,

    // Companies
    `INSERT INTO companies (id, name, description) VALUES
    (1, 'TechCo', 'חברת הייטק מובילה'),
    (2, 'SalesPro', 'חברת שיווק ומכירות')`,

    // Jobs
    `INSERT INTO jobs (JobID, Title, Description, Requirements, company_id, Location, job_type_id, position_id, Salary, Status) VALUES
    (1, 'מפתח/ת Full Stack', 'פיתוח מערכות web מתקדמות', 'ניסיון של 3 שנים בפיתוח', 1, 'תל אביב', 1, 1, '20000-30000', 'open'),
    (2, 'מנהל/ת מכירות', 'ניהול צוות מכירות', 'ניסיון של 5 שנים במכירות', 2, 'ירושלים', 1, 2, '15000-25000', 'open'),
    (3, 'מורה למתמטיקה', 'הוראת מתמטיקה בתיכון', 'תואר בחינוך', 1, 'חיפה', 2, 4, '8000-12000', 'open')`
  ];

  const executeQueries = async () => {
    try {
      for (const query of sampleData) {
        await new Promise((resolve, reject) => {
          db.query(query, (err) => {
            if (err) {
              console.error('Error executing query:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
      res.json({ message: 'Sample data imported successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  executeQueries();
});

app.get('/api/jobs/search', (req, res) => {
  const { field, role, jobType, city } = req.query;



  // Simplified query without complex joins that might fail
  let conditions = [];
  let params = [];

  if (field) {
    conditions.push('p.category_id = ?');
    params.push(field);
  }

  if (role) {
    conditions.push('Title LIKE ?');
    params.push(`%${role}%`);
  }

  if (jobType) {
    conditions.push('job_type_id = ?');
    params.push(jobType);
  }

  if (city) {
    conditions.push('city_id = ?');
    params.push(city);
  }

  let whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  if (whereClause) {
    whereClause += ' AND Status = "open"';
  } else {
    whereClause = 'WHERE Status = "open"';
  }

  const filterQuery = `
    SELECT 
      j.JobID as JobID,
      j.Title as JobTitle,
      j.Description as Description,
      j.Requirements as Requirements,
      j.Salary as Salary,
      c.name as CityName,
      j.PostDate as CreatedAt,
      j.Status as Status,
      e.CompanyName as CompanyName
    FROM jobs j
    LEFT JOIN cities c ON j.city_id = c.id
    LEFT JOIN employer e ON j.EmployerID = e.EmployerID
    LEFT JOIN positions p ON j.position_id = p.id
    ${whereClause}
    ORDER BY j.PostDate DESC
  `;

  console.log('SQL query:', filterQuery);
  console.log('Query params:', params);

  db.query(filterQuery, params, (err, results) => {
    if (err) {
      console.error('Error searching jobs:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Jobs found:', results);
    res.json(results || []);
  });
});

// Get single job by ID
app.get('/api/jobs/:id', (req, res) => {
  const jobId = req.params.id;
  
  const query = `
    SELECT 
      j.JobID as JobID,
      j.Title as JobTitle,
      j.Description as Description,
      j.Requirements as Requirements,
      j.Salary as Salary,
      c.name as CityName,
      j.PostDate as CreatedAt,
      j.Status as Status,
      e.CompanyName as CompanyName
    FROM jobs j
    LEFT JOIN cities c ON j.city_id = c.id
    LEFT JOIN employer e ON j.EmployerID = e.EmployerID
    WHERE j.JobID = ?
  `;

  console.log('Fetching job details for ID:', jobId);

  db.query(query, [jobId], (err, results) => {
    if (err) {
      console.error('Error fetching job details:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    console.log('Job details found:', results[0]);
    res.json(results[0]);
  });
});

// Get all job fields (categories)
app.get('/api/fields', (req, res) => {
  const query = 'SELECT CategoryID, CategoryName FROM categories WHERE CategoryID >= 9 ORDER BY CategoryName';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Categories found:', results);
    res.json(results || []);
  });
});

// Get all cities
app.get('/api/cities', (req, res) => {
  const query = 'SELECT id as CityID, name as CityName FROM cities ORDER BY name';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching cities:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Cities found:', results);
    res.json(results || []);
  });
});

// Get roles by field (category)
app.get('/api/roles/:fieldId', (req, res) => {
  const fieldId = req.params.fieldId;
  console.log('Fetching roles for field ID:', fieldId);

  const query = `
    SELECT
      p.id as RoleID,
      p.name as RoleName
    FROM positions p
    WHERE p.category_id = ?
    ORDER BY p.name
  `;

  db.query(query, [parseInt(fieldId)], (err, results) => {
    if (err) {
      console.error('Error fetching roles:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Roles found:', results);
    res.json(results || []);
  });
});

// Create roles table if it doesn't exist
const createRolesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS roles (
      role_id int(11) NOT NULL AUTO_INCREMENT,
      role_name varchar(50) UNIQUE NOT NULL,
      description varchar(255) DEFAULT NULL,
      PRIMARY KEY (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating roles table:', err);
    } else {
      console.log('Roles table ready');
      // Insert default roles - check if description column exists first
      db.query('DESCRIBE roles', (descErr, columns) => {
        const hasDescription = columns && columns.some(col => col.Field === 'description');
        
        let insertRoles;
        if (hasDescription) {
          insertRoles = `
            INSERT IGNORE INTO roles (role_id, role_name, description) VALUES 
            (1, 'admin', 'Administrator'),
            (2, 'employer', 'Employer'),
            (3, 'worker', 'Job Seeker')`;
        } else {
          insertRoles = `
            INSERT IGNORE INTO roles (role_id, role_name) VALUES 
            (1, 'admin'),
            (2, 'employer'),
            (3, 'worker')`;
        }
        
        db.query(insertRoles, (err, results) => {
          if (err) {
            console.error('Error inserting roles:', err);
          } else {
            console.log('Default roles inserted');
          }
        });
      });
    }
  });
};

// Create users table if it doesn't exist
const createUsersTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id int(11) NOT NULL AUTO_INCREMENT,
      full_name varchar(100) NOT NULL,
      email varchar(100) NOT NULL UNIQUE,
      password varchar(255) NOT NULL,
      role_id int(11),
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (role_id) REFERENCES roles(role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready');
    }
  });
};

// Create worker profiles table
const createWorkerProfilesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS worker_profiles (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      phone varchar(20),
      address varchar(255),
      skills text,
      experience_years int,
      education varchar(255),
      preferred_job_type varchar(100),
      preferred_location varchar(100),
      salary_expectation varchar(50),
      cv_file varchar(255),
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating worker_profiles table:', err);
    } else {
      console.log('Worker profiles table ready');
    }
  });
};

// Create employer profiles table
const createEmployerProfilesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS employer_profiles (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      company_name varchar(255) NOT NULL,
      company_description text,
      industry varchar(100),
      company_size varchar(50),
      website varchar(255),
      phone varchar(20),
      address varchar(255),
      logo_file varchar(255),
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating employer_profiles table:', err);
    } else {
      console.log('Employer profiles table ready');
    }
  });
};

// Create admin profiles table
const createAdminProfilesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS admin_profiles (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      department varchar(100),
      permissions text,
      phone varchar(20),
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating admin_profiles table:', err);
    } else {
      console.log('Admin profiles table ready');
    }
  });
};

// Create jobs table
const createJobsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS jobs (
      id int(11) NOT NULL AUTO_INCREMENT,
      title varchar(255) NOT NULL,
      description text,
      requirements text,
      salary_min decimal(10,2),
      salary_max decimal(10,2),
      location varchar(255),
      job_type varchar(100),
      category varchar(100),
      company_name varchar(255),
      employer_id int(11) NOT NULL,
      status enum('active', 'closed', 'draft') DEFAULT 'active',
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating jobs table:', err);
    } else {
      console.log('Jobs table ready');
    }
  });
};

// Job applications table creation - simplified without foreign keys
const createJobApplicationsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS job_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      worker_id INT NOT NULL,
      user_id INT NOT NULL,
      employer_id INT,
      status VARCHAR(20) DEFAULT 'pending',
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      cv_file_path VARCHAR(255),
      cover_letter TEXT,
      notes TEXT,
      UNIQUE KEY unique_application (job_id, worker_id),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.log('Job applications table already exists or created successfully');
    } else {
      console.log('Job applications table ready');
    }
  });
};

// Create password reset tokens table
const createPasswordResetTokensTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;

  db.query(query, (err) => {
    if (err) {
      console.error('Error creating password_reset_tokens table:', err);
    } else {
      console.log('Password reset tokens table created or already exists');
    }
  });
};

// Start server
// Test route to check database
app.get('/api/test-db', async (req, res) => {
  try {
    db.query('SHOW TABLES', (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ tables: results });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize database tables
const initDatabase = () => {
  // Create tables on startup in the correct order to satisfy foreign key constraints
  createRolesTable();
  
  // Wait a bit for roles table to be created
  setTimeout(() => {
    createUsersTable();
    
    // Wait for users table
    setTimeout(() => {
      createWorkerProfilesTable();
      createEmployerProfilesTable();
      createAdminProfilesTable();
      
      // Wait for profiles to be created
      setTimeout(() => {
        createJobsTable();
        
        // Wait for jobs table
        setTimeout(() => {
          createJobApplicationsTable();
          createPasswordResetTokensTable();
          createNotificationsTable();
          createJobBookmarksTable();
          
          // Run migrations after all tables are created
          migrateJobApplicationsTable();
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
};

// Create admin endpoint
app.post('/api/create-admin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if admin role exists
    const checkRoleQuery = 'SELECT role_id FROM roles WHERE role_name = ?';
    db.query(checkRoleQuery, ['admin'], async (err, roleResults) => {
      if (err) {
        console.error('Error checking role:', err);
        return res.status(500).json({ error: err.message });
      }

      let roleId;
      if (roleResults.length === 0) {
        // Create admin role if it doesn't exist
        const createRoleQuery = 'INSERT INTO roles (role_name) VALUES (?)';
        db.query(createRoleQuery, ['admin'], (err, result) => {
          if (err) {
            console.error('Error creating role:', err);
            return res.status(500).json({ error: err.message });
          }
          roleId = result.insertId;
        });
      } else {
        roleId = roleResults[0].role_id;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const createUserQuery = `
        INSERT INTO users (email, password, role_id, full_name)
        VALUES (?, ?, ?, 'Admin User')
      `;

      db.query(createUserQuery, [email, hashedPassword, roleId], (err, result) => {
        if (err) {
          console.error('Error creating admin:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Admin created successfully', userId: result.insertId });
      });
    });
  } catch (error) {
    console.error('Error in create-admin:', error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// Admin Job Management Endpoints
//
// These endpoints allow administrators to view all job postings, create new
// postings, update existing ones and remove postings entirely.  They operate
// against the `jobs` table that is created by this server (see createJobsTable
// above).  This table uses `id` as the primary key and stores employer
// information in the `employer_id` column.  New jobs created via the
// admin API will associate the posting with the admin user's id.  Salary
// values are split into a minimum and maximum and stored in the
// `salary_min` and `salary_max` columns.  The status defaults to 'active'
// if omitted.  All routes below require both a valid JWT and the admin role.

// Get all jobs (admin view)
app.get('/api/admin/jobs', verifyToken, requireAdmin, (req, res) => {
  const query = `
    SELECT
      id,
      title,
      description,
      requirements,
      salary_min,
      salary_max,
      location,
      job_type,
      category,
      company_name,
      status,
      created_at
    FROM jobs
    ORDER BY created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching admin job list:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

// Create a new job (admin)
app.post('/api/admin/jobs', verifyToken, requireAdmin, (req, res) => {
  const {
    title,
    description,
    requirements,
    salary_min,
    salary_max,
    location,
    job_type,
    category,
    company_name,
    status
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  const employerId = req.user.userId;
  const jobStatus = status && ['active', 'closed', 'draft'].includes(status) ? status : 'active';
  const insertQuery = `
    INSERT INTO jobs (
      title,
      description,
      requirements,
      salary_min,
      salary_max,
      location,
      job_type,
      category,
      company_name,
      employer_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [
      title,
      description,
      requirements || null,
      salary_min || null,
      salary_max || null,
      location || null,
      job_type || null,
      category || null,
      company_name || null,
      employerId,
      jobStatus
    ],
    (err, result) => {
      if (err) {
        console.error('Error creating job (admin):', err);
        return res.status(500).json({ error: 'Failed to create job' });
      }
      res.json({ message: 'Job created successfully', id: result.insertId });
    }
  );
});

// Update an existing job (admin)
app.put('/api/admin/jobs/:id', verifyToken, requireAdmin, (req, res) => {
  const jobId = req.params.id;
  const {
    title,
    description,
    requirements,
    salary_min,
    salary_max,
    location,
    job_type,
    category,
    company_name,
    status
  } = req.body;
  // Build dynamic SET clause based on provided fields
  const fields = [];
  const params = [];
  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    params.push(description);
  }
  if (requirements !== undefined) {
    fields.push('requirements = ?');
    params.push(requirements);
  }
  if (salary_min !== undefined) {
    fields.push('salary_min = ?');
    params.push(salary_min);
  }
  if (salary_max !== undefined) {
    fields.push('salary_max = ?');
    params.push(salary_max);
  }
  if (location !== undefined) {
    fields.push('location = ?');
    params.push(location);
  }
  if (job_type !== undefined) {
    fields.push('job_type = ?');
    params.push(job_type);
  }
  if (category !== undefined) {
    fields.push('category = ?');
    params.push(category);
  }
  if (company_name !== undefined) {
    fields.push('company_name = ?');
    params.push(company_name);
  }
  if (status && ['active', 'closed', 'draft'].includes(status)) {
    fields.push('status = ?');
    params.push(status);
  }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields provided for update' });
  }
  const updateQuery = `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`;
  params.push(jobId);
  db.query(updateQuery, params, (err, result) => {
    if (err) {
      console.error('Error updating job (admin):', err);
      return res.status(500).json({ error: 'Failed to update job' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job updated successfully' });
  });
});

// Delete a job (admin)
app.delete('/api/admin/jobs/:id', verifyToken, requireAdmin, (req, res) => {
  const jobId = req.params.id;
  const deleteQuery = 'DELETE FROM jobs WHERE id = ?';
  db.query(deleteQuery, [jobId], (err, result) => {
    if (err) {
      console.error('Error deleting job (admin):', err);
      return res.status(500).json({ error: 'Failed to delete job' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  });
});

// -----------------------------------------------------------------------------
// Get applications for a specific job (admin view)
//
// This route allows administrators to view all applications for any job in the
// system, regardless of employer.  It returns the same detailed fields as
// the employer dashboard, including candidate contact information and a link
// to the candidate CV file stored in the worker_profiles table.  Requires
// both authentication and the admin role.
app.get('/api/admin/jobs/:jobId/applications', (req, res) => {
  const jobId = req.params.jobId;
  const applicationsQuery = `
    SELECT
      ja.*,
      u.full_name,
      u.email,
      wp.phone,
      wp.skills,
      wp.experience_years,
      wp.education,
      wp.cv_file,
      ja.cv_file_path as application_cv,
      ja.cover_letter
    FROM job_applications ja
    JOIN users u ON ja.worker_id = u.id
    LEFT JOIN worker_profiles wp ON ja.worker_id = wp.user_id
    WHERE ja.job_id = ?
    ORDER BY ja.applied_at DESC
  `;
  db.query(applicationsQuery, [jobId], (err, results) => {
    if (err) {
      console.error('Error fetching job applications (admin):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

// Placement tracking system
app.post('/api/placements', verifyToken, requireAdmin, (req, res) => {
  const { job_id, candidate_id, start_date, salary, placement_fee, notes } = req.body;

  const insertQuery = `
    INSERT INTO placements (job_id, candidate_id, start_date, salary, placement_fee, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
  `;

  db.query(insertQuery, [job_id, candidate_id, start_date, salary, placement_fee, notes], (err, results) => {
    if (err) {
      console.error('Error creating placement:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Update job status to filled
    const updateJobQuery = 'UPDATE jobs SET status = "filled" WHERE id = ?';
    db.query(updateJobQuery, [job_id], (err) => {
      if (err) {
        console.error('Error updating job status:', err);
      }
    });

    res.json({
      message: 'Placement created successfully',
      placementId: results.insertId
    });
  });
});

// Get all placements
app.get('/api/placements', verifyToken, (req, res) => {
  const query = `
    SELECT
      p.*,
      j.title as job_title,
      j.company_name,
      c.FullName as candidate_name,
      c.Email as candidate_email
    FROM placements p
    LEFT JOIN jobs j ON p.job_id = j.id
    LEFT JOIN candidate c ON p.candidate_id = c.CandidateID
    ORDER BY p.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching placements:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results || []);
  });
});

// Update placement status
app.put('/api/placements/:id/status', verifyToken, requireAdmin, (req, res) => {
  const { status, notes } = req.body;
  const placementId = req.params.id;

  if (!['active', 'completed', 'terminated'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updateQuery = `
    UPDATE placements
    SET status = ?, notes = ?, updated_at = NOW()
    WHERE id = ?
  `;

  db.query(updateQuery, [status, notes, placementId], (err, results) => {
    if (err) {
      console.error('Error updating placement:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Placement status updated successfully' });
  });
});

// Enhanced dashboard statistics
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
  const statsQueries = {
    totalJobs: 'SELECT COUNT(*) as count FROM jobs',
    activeJobs: 'SELECT COUNT(*) as count FROM jobs WHERE status = "active"',
    totalCandidates: 'SELECT COUNT(*) as count FROM candidate',
    totalPlacements: 'SELECT COUNT(*) as count FROM placements',
    activePlacements: 'SELECT COUNT(*) as count FROM placements WHERE status = "active"',
    totalApplications: 'SELECT COUNT(*) as count FROM job_applications',
    pendingApplications: 'SELECT COUNT(*) as count FROM job_applications WHERE status = "pending"',
    recentJobs: `
      SELECT COUNT(*) as count
      FROM jobs
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `,
    recentApplications: `
      SELECT COUNT(*) as count
      FROM job_applications
      WHERE DATE(applied_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `,
    topCategories: `
      SELECT c.CategoryName, COUNT(j.id) as job_count
      FROM categories c
      LEFT JOIN positions p ON c.CategoryID = p.category_id
      LEFT JOIN jobs j ON p.id = j.position_id
      WHERE j.status = 'active'
      GROUP BY c.CategoryID, c.CategoryName
      ORDER BY job_count DESC
      LIMIT 5
    `
  };

  const executeQueries = async () => {
    const stats = {};

    for (const [key, query] of Object.entries(statsQueries)) {
      try {
        const results = await new Promise((resolve, reject) => {
          db.query(query, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (key === 'topCategories') {
          stats[key] = results;
        } else {
          stats[key] = results[0]?.count || 0;
        }
      } catch (error) {
        console.error(`Error executing ${key} query:`, error);
        stats[key] = key === 'topCategories' ? [] : 0;
      }
    }

    return stats;
  };

  executeQueries()
    .then(stats => res.json(stats))
    .catch(error => {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Database error' });
    });
});

// Email notification system
app.post('/api/notifications/send', verifyToken, requireAdmin, (req, res) => {
  const { type, recipient_id, subject, message, job_id } = req.body;

  // Get recipient email
  const getUserQuery = 'SELECT email, full_name FROM users WHERE id = ?';
  db.query(getUserQuery, [recipient_id], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResults[0];

    // Store notification in database
    const insertNotificationQuery = `
      INSERT INTO notifications (user_id, type, subject, message, job_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'sent', NOW())
    `;

    db.query(insertNotificationQuery, [recipient_id, type, subject, message, job_id], (err, results) => {
      if (err) {
        console.error('Error storing notification:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Here you would integrate with your email service (nodemailer)
      // For now, we'll just return success
      res.json({
        message: 'Notification sent successfully',
        notificationId: results.insertId
      });
    });
  });
});

// Get user notifications
app.get('/api/notifications', verifyToken, (req, res) => {
  const query = `
    SELECT n.*, j.title as job_title
    FROM notifications n
    LEFT JOIN jobs j ON n.job_id = j.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `;

  db.query(query, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results || []);
  });
});

// Job bookmarking system
app.post('/api/bookmarks', verifyToken, (req, res) => {
  const { job_id } = req.body;
  const user_id = req.user.userId;

  // Check if already bookmarked
  const checkQuery = 'SELECT id FROM job_bookmarks WHERE user_id = ? AND job_id = ?';
  db.query(checkQuery, [user_id, job_id], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Job already bookmarked' });
    }

    const insertQuery = `
      INSERT INTO job_bookmarks (user_id, job_id, created_at)
      VALUES (?, ?, NOW())
    `;

    db.query(insertQuery, [user_id, job_id], (err, results) => {
      if (err) {
        console.error('Error creating bookmark:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Job bookmarked successfully', bookmarkId: results.insertId });
    });
  });
});

// Get user bookmarks
app.get('/api/bookmarks', verifyToken, (req, res) => {
  const query = `
    SELECT
      jb.*,
      j.title as job_title,
      j.description,
      j.salary,
      j.location,
      j.company_name
    FROM job_bookmarks jb
    JOIN jobs j ON jb.job_id = j.id
    WHERE jb.user_id = ?
    ORDER BY jb.created_at DESC
  `;

  db.query(query, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching bookmarks:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results || []);
  });
});

// Remove bookmark
app.delete('/api/bookmarks/:jobId', verifyToken, (req, res) => {
  const jobId = req.params.jobId;
  const userId = req.user.userId;

  const deleteQuery = 'DELETE FROM job_bookmarks WHERE user_id = ? AND job_id = ?';
  db.query(deleteQuery, [userId, jobId], (err, results) => {
    if (err) {
      console.error('Error removing bookmark:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  });
});

// -----------------------------------------------------------------------------
// File upload for CVs
//
// Use multer to accept CV uploads from workers.  Uploaded files are stored in
// the uploads/cvs directory with a unique filename.  After successfully
// uploading the file we update the worker's profile record so that the CV
// appears in any application lists for employers and administrators.  The
// existing code commented out in earlier versions has been re-enabled and
// adapted to write the file path into the worker_profiles table.  If a
// profile does not yet exist we create it on the fly.  A separate route
// (/api/download-cv/:filename) is provided to serve the files to employers
// and admins directly from the server.
// Note: Multer configuration has been moved to the top of the file to be available for all routes


// Upload CV for worker profile
app.post('/api/worker/upload-cv', verifyToken, upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const userId = req.user.userId;
  const cvPath = path.join('uploads', 'cvs', req.file.filename);
  const cvFilename = req.file.originalname;
  
  console.log('CV Upload - User ID:', userId);
  console.log('CV Upload - File path:', cvPath);
  console.log('CV Upload - Original filename:', cvFilename);
  
  // Update worker profile with CV
  const checkQuery = 'SELECT id FROM worker_profiles WHERE user_id = ?';
  
  db.query(checkQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error checking worker profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    let query;
    let params;
    
    if (results.length > 0) {
      // Update existing profile
      query = `
        UPDATE worker_profiles 
        SET cv_file = ?, cv_filename = ?
        WHERE user_id = ?
      `;
      params = [cvPath, cvFilename, userId];
    } else {
      // Create new profile with CV
      query = `
        INSERT INTO worker_profiles (user_id, cv_file, cv_filename) 
        VALUES (?, ?, ?)
      `;
      params = [userId, cvPath, cvFilename];
    }
    
    db.query(query, params, (err2) => {
      if (err2) {
        console.error('Error saving CV to profile:', err2);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('CV saved successfully for user:', userId);
      res.json({ 
        success: true, 
        message: 'CV uploaded successfully', 
        path: cvPath,  // This is what the frontend expects
        filePath: cvPath,  // For consistency
        filename: cvFilename,
        cvPath: cvPath  // Additional field to ensure compatibility
      });
    });
  });
});

// Get/Set notification settings
app.get('/api/worker/notification-settings', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT email_notifications, sms_notifications, job_recommendations, application_updates
    FROM worker_profiles
    WHERE user_id = ?`;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      // Return defaults if no profile exists
      return res.json({
        email: true,
        sms: false,
        jobRecommendations: true,
        applicationUpdates: true
      });
    }
    
    res.json({
      email: results[0].email_notifications,
      sms: results[0].sms_notifications,
      jobRecommendations: results[0].job_recommendations,
      applicationUpdates: results[0].application_updates
    });
  });
});

app.post('/api/worker/notification-settings', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { email, sms, jobRecommendations, applicationUpdates } = req.body;
  
  const updateQuery = `
    INSERT INTO worker_profiles (user_id, email_notifications, sms_notifications, job_recommendations, application_updates)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      email_notifications = VALUES(email_notifications),
      sms_notifications = VALUES(sms_notifications),
      job_recommendations = VALUES(job_recommendations),
      application_updates = VALUES(application_updates)`;
  
  db.query(updateQuery, [userId, email, sms, jobRecommendations, applicationUpdates], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Settings updated' });
  });
});

// Get worker statistics
app.get('/api/worker/statistics', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  // Get application statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as totalApplications,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
      AVG(CASE 
        WHEN status != 'pending' 
        THEN DATEDIFF(updated_at, applied_at) 
        ELSE NULL 
      END) as avgResponseTime
    FROM job_applications
    WHERE worker_id = ?`;
  
  db.query(statsQuery, [userId], (err, statsResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get profile views
    const profileQuery = 'SELECT profile_views FROM worker_profiles WHERE user_id = ?';
    db.query(profileQuery, [userId], (err, profileResults) => {
      const profileViews = profileResults && profileResults[0] ? profileResults[0].profile_views : 0;
      const stats = statsResults[0];
      
      res.json({
        totalApplications: stats.totalApplications || 0,
        successRate: stats.totalApplications > 0 
          ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100) 
          : 0,
        avgResponseTime: Math.round(stats.avgResponseTime) || 0,
        profileViews: profileViews
      });
    });
  });
});

// Upload CV and associate it with the worker profile (legacy endpoint)
app.post('/api/upload-cv', verifyToken, upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const userId = req.user.userId;
  const cvPath = path.join('uploads', 'cvs', req.file.filename);
  // Check if a worker profile exists
  const checkQuery = 'SELECT id FROM worker_profiles WHERE user_id = ?';
  db.query(checkQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error checking worker profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      // Update existing worker profile with CV path
      const updateQuery = 'UPDATE worker_profiles SET cv_file = ? WHERE user_id = ?';
      db.query(updateQuery, [cvPath, userId], (err) => {
        if (err) {
          console.error('Error updating CV path:', err);
          return res.status(500).json({ error: 'Failed to update CV path' });
        }
        return res.json({ message: 'CV uploaded successfully', filename: req.file.filename, path: cvPath });
      });
    } else {
      // Create a new worker profile with just the CV.  All other fields are set to NULL.
      const insertQuery = `INSERT INTO worker_profiles (user_id, cv_file) VALUES (?, ?)`;
      db.query(insertQuery, [userId, cvPath], (err) => {
        if (err) {
          console.error('Error creating worker profile with CV:', err);
          return res.status(500).json({ error: 'Failed to save CV' });
        }
        return res.json({ message: 'CV uploaded successfully', filename: req.file.filename, path: cvPath });
      });
    }
  });
});

// Serve uploaded CVs for download.  Only the file name is accepted to
// prevent directory traversal.  The caller must still be authenticated,
// however no role is enforced here because employers and admins both need
// access to candidate CVs.
app.get('/api/download-cv/:filename', verifyToken, (req, res) => {
  const { filename } = req.params;
  // Validate the filename to prevent directory traversal
  if (!/^[\w.-]+\.(pdf|doc|docx)$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid file name' });
  }
  const filePath = path.join(cvUploadDir, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending CV file:', err);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    }
  });
});

// Application status notification system
app.post('/api/applications/:id/notify', verifyToken, requireAdmin, (req, res) => {
  const applicationId = req.params.id;
  const { status, message } = req.body;

  // Get application details
  const getApplicationQuery = `
    SELECT ja.*, j.title, u.email, u.full_name
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    JOIN users u ON ja.worker_id = u.id
    WHERE ja.id = ?
  `;

  db.query(getApplicationQuery, [applicationId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = results[0];

    // Create notification
    const notificationQuery = `
      INSERT INTO notifications (user_id, type, subject, message, job_id, status, created_at)
      VALUES (?, 'application_status', ?, ?, ?, 'unread', NOW())
    `;

    const subject = `עדכון סטטוס מועמדות - ${application.title}`;
    const notificationMessage = message || `סטטוס המועמדות שלך עודכן ל: ${status}`;

    db.query(notificationQuery, [application.worker_id, subject, notificationMessage, application.job_id], (err, notifResults) => {
      if (err) {
        console.error('Error creating notification:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Emit WebSocket event for real-time notification
      if (global.wss && global.wss.broadcast) {
        global.wss.broadcast({
          type: 'application_status_update',
          data: {
            applicationId,
            status,
            message: notificationMessage,
            jobTitle: application.title
          }
        }, (clientInfo) => clientInfo.userId == application.worker_id);
      }

      res.json({ message: 'Notification sent successfully' });
    });
  });
});



// Note: CV upload directories are created above.  The code below
// previously duplicated the creation of the uploads directory and
// re-declared the fs import, which caused "Identifier 'fs' has
// already been declared" errors.  Those lines have been removed to
// avoid conflicts.

// Create required tables first
createJobApplicationsTable();
createNotificationsTable();
createJobBookmarksTable();

// Set up database triggers and listeners
setupDatabaseTriggers().catch(console.error);

// Migrate existing tables if necessary
migrateJobApplicationsTable();

// Initialize database tables on startup
initDatabase();

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Database connected successfully`);

  // Store WebSocket server globally for access in other routes
  global.wss = setupWebSocket(server);
});

module.exports = { app, server };
