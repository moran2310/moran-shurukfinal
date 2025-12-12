const express = require('express');
const router = express.Router();
// Use the promise-based API from our MySQL connection.  See db.js.
const db = require('./db');
// Use the promise connection exported from db.js rather than invoking it
const pool = db.promise;

// Get recent employer activity and job postings
router.get('/api/admin/employer-stats', async (req, res) => {
  try {
    // In this schema, employer information lives in the `employer` table.
    // We join to the `users` table for email and last login fields.
    const recentLoginsQuery = `
      SELECT em.EmployerID AS id,
             em.CompanyName AS company_name,
             u.email,
             u.last_login,
             COUNT(j.id) AS total_jobs
      FROM employer em
      JOIN users u ON em.UserID = u.id
      LEFT JOIN jobs j ON em.EmployerID = j.employer_id
      WHERE u.last_login >= NOW() - INTERVAL 30 DAY
      GROUP BY em.EmployerID, em.CompanyName, u.email, u.last_login
      ORDER BY u.last_login DESC
      LIMIT 10
    `;
    const [recent] = await pool.query(recentLoginsQuery);

    // Employers with most active job postings.  Use JSON_OBJECT and
    // JSON_ARRAYAGG which are supported in MySQL >= 5.7.  Fallback to an
    // empty array if the JSON aggregation fails.
    const activeJobsQuery = `
      SELECT em.EmployerID AS id,
             em.CompanyName AS company_name,
             COUNT(j.id) AS active_jobs,
             JSON_ARRAYAGG(JSON_OBJECT(
               'id', j.id,
               'title', j.title,
               'created_at', j.created_at,
               'status', j.status
             )) AS jobs
      FROM employer em
      JOIN jobs j ON em.EmployerID = j.employer_id
      WHERE j.status = 'active'
      GROUP BY em.EmployerID, em.CompanyName
      ORDER BY active_jobs DESC
      LIMIT 10
    `;
    let activeRes;
    try {
      const [rows] = await pool.query(activeJobsQuery);
      activeRes = rows;
    } catch (err) {
      console.error('Error executing active jobs query:', err);
      activeRes = [];
    }

    // New employers registered in the last 30 days.  We join to users for
    // the created_at timestamp which lives on the users table.
    const newEmployersQuery = `
      SELECT em.EmployerID AS id,
             em.CompanyName AS company_name,
             u.email,
             u.created_at
      FROM employer em
      JOIN users u ON em.UserID = u.id
      WHERE u.created_at >= NOW() - INTERVAL 30 DAY
      ORDER BY u.created_at DESC
    `;
    const [newEmps] = await pool.query(newEmployersQuery);

    res.json({
      recentLogins: recent,
      activeJobs: activeRes,
      newEmployers: newEmps
    });
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
