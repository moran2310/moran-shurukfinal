const express = require('express');
const router = express.Router();
// Use the promise-based API from our MySQL connection.  The `db.js`
// module exports both a callback-style connection and a `.promise()`
// method which returns a promise-based connection.  Here we use
// `.promise()` so that `await pool.query(...)` resolves as expected.
const db = require('./db');
// Use the promise connection exported from db.js.  The `promise`
// property is an already-initialised connection, not a method.
const pool = db.promise;

// Get candidate activity and application status
router.get('/api/admin/candidate-stats', async (req, res) => {
  try {
    // Recent applications in the last 30 days.  Note: `employer` and
    // `candidate` tables in this MySQL schema use singular names and
    // capitalised column names.  We adjust the joins accordingly.
    const recentApplicationsQuery = `
      SELECT 
        ja.id,
        j.title AS job_title,
        co.CompanyName AS company_name,
        u.full_name AS candidate_name,
        ep.full_name AS employer_name,
        ja.status,
        CASE 
          WHEN ja.status = 'applied' THEN 'הוגשה מועמדות'
          WHEN ja.status = 'reviewing' THEN 'בבדיקה'
          WHEN ja.status = 'interview' THEN 'זומן לראיון'
          WHEN ja.status = 'offer' THEN 'קיבל הצעה'
          WHEN ja.status = 'hired' THEN 'התקבל לעבודה'
          WHEN ja.status = 'rejected' THEN 'נדחה'
        END AS status_text,
        ja.created_at AS apply_date,
        ja.updated_at AS last_update
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.CompanyID
      LEFT JOIN users u ON ja.worker_id = u.id
      LEFT JOIN users ep ON j.employer_id = ep.id
      WHERE ja.created_at >= NOW() - INTERVAL 30 DAY
      ORDER BY ja.updated_at DESC
      LIMIT 20
    `;
    const [recentApps] = await pool.query(recentApplicationsQuery);

    // Active candidates (submitted applications in the last 30 days)
    const activeCandidatesQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        wp.phone,
        wp.skills,
        wp.experience_years,
        COUNT(ja.id) AS total_applications,
        MAX(ja.created_at) AS last_application
      FROM users u
      JOIN job_applications ja ON u.id = ja.worker_id
      LEFT JOIN worker_profiles wp ON u.id = wp.user_id
      WHERE ja.created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY u.id, u.full_name, u.email, wp.phone, wp.skills, wp.experience_years
      ORDER BY last_application DESC
    `;
    const [activeCands] = await pool.query(activeCandidatesQuery);

    // Placement history (applications marked as hired)
    const placementHistoryQuery = `
      SELECT 
        u.full_name AS candidate_name,
        j.title AS job_title,
        co.CompanyName AS company_name,
        ja.created_at AS apply_date,
        ja.updated_at AS hire_date
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.CompanyID
      LEFT JOIN users u ON ja.worker_id = u.id
      WHERE ja.status = 'hired'
      ORDER BY ja.updated_at DESC
      LIMIT 20
    `;
    const [placements] = await pool.query(placementHistoryQuery);

    res.json({
      recentApplications: recentApps,
      activeCandidates: activeCands,
      placementHistory: placements
    });
  } catch (error) {
    console.error('Error fetching candidate stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
