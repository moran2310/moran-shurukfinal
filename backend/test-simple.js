const express = require('express');
const cors = require('cors');
const db = require('./db');
const { verifyToken } = require('./auth');

const app = express();
const PORT = 5000;

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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
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
      ja.updated_at,
      j.title,
      j.company_name,
      j.location,
      j.description,
      j.salary_min,
      j.salary_max
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.user_id = ?
    ORDER BY ja.applied_at DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching worker applications:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Get suggested jobs endpoint
app.get('/api/jobs/suggested', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      j.*,
      CASE WHEN ja.id IS NOT NULL THEN 1 ELSE 0 END as already_applied
    FROM jobs j
    LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.user_id = ?
    WHERE j.status = 'active'
    ORDER BY j.created_at DESC
    LIMIT 20
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching suggested jobs:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
});
