const express = require('express');
const router = express.Router();
const db = require('./db');
const { verifyToken } = require('./auth');

router.get('/category-stats', async (req, res) => {
  try {
    /*
     * MySQL-compatible category statistics
     *
     * The original implementation used PostgreSQL syntax to compute
     * placement trends and average days to placement.  Our schema and
     * database differ, so we instead compute a simplified set of
     * statistics for each category:
     *   - monthly_placements: number of jobs posted in the last 30 days
     *     for the category.  We consider a job "posted" if its
     *     `created_at` timestamp falls within the last 30 days.
     *   - avg_days_to_placement, placement_trend and days_trend are
     *     returned as zeroes because we do not have a consistent
     *     placements table or timestamps to compute these metrics across
     *     multiple database implementations.  These fields are retained
     *     to satisfy the frontend contract.
     */
    const query = `
      SELECT 
        c.CategoryName AS category,
        COUNT(jcm.job_id) AS monthly_placements,
        0 AS avg_days_to_placement,
        0 AS placement_trend,
        0 AS days_trend
      FROM categories c
      LEFT JOIN job_category_map jcm ON c.CategoryID = jcm.category_id
      LEFT JOIN jobs j ON jcm.job_id = j.JobID
      WHERE j.PostDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) OR j.PostDate IS NULL
      GROUP BY c.CategoryID, c.CategoryName
      ORDER BY monthly_placements DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing category stats query:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results || []);
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
