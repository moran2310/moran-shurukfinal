const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 5001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Create database connection
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'jobportal',
  port: 3306
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create job_applications table if it doesn't exist
const createJobApplicationsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS job_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      user_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'rejected', 'in_review') DEFAULT 'pending',
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      cv_file_path VARCHAR(255),
      cover_letter TEXT,
      UNIQUE KEY unique_application (job_id, user_id),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating job_applications table:', err);
    } else {
      console.log('Job applications table created successfully');
    }
  });
};

// Simple token verification (for testing)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // For testing, just extract user ID from a simple token
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Get worker applications endpoint
app.get('/api/worker/applications', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      ja.id,
      ja.job_id,
      ja.status,
      ja.applied_at,
      ja.updated_at
    FROM job_applications ja
    WHERE ja.user_id = ?
    ORDER BY ja.applied_at DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching worker applications:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json(results);
  });
});

// Get suggested jobs endpoint
app.get('/api/jobs/suggested', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      j.*
    FROM jobs j
    WHERE j.status = 'active'
    ORDER BY j.created_at DESC
    LIMIT 20
  `;
  
  db.query(query, [], (err, results) => {
    if (err) {
      console.error('Error fetching suggested jobs:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json(results);
  });
});

// Initialize tables
createJobApplicationsTable();

app.listen(PORT, () => {
  console.log(`Minimal server is running on port ${PORT}`);
});
