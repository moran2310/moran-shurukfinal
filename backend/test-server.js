const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "jobportal",
  port: 3306,
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Get fields/categories endpoint
app.get("/api/fields", (req, res) => {
  const query = "SELECT * FROM categories ORDER BY name";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`Found ${results.length} fields`);
    res.json(results || []);
  });
});

// Get cities endpoint
app.get("/api/cities", (req, res) => {
  const query = "SELECT * FROM cities ORDER BY name";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`Found ${results.length} cities`);
    res.json(results || []);
  });
});

// Get roles by field endpoint
app.get("/api/roles/:fieldId", (req, res) => {
  const fieldId = req.params.fieldId;
  const query = "SELECT * FROM positions WHERE category_id = ? ORDER BY name";

  db.query(query, [fieldId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`Found ${results.length} roles for field ${fieldId}`);
    res.json(results || []);
  });
});

// Simple job search endpoint
app.get("/api/jobs/search", (req, res) => {
  console.log("Job search request received:", req.query);

  const { field, role, jobType, city } = req.query;

  let conditions = [];
  let params = [];

  if (field) {
    conditions.push("position_id = ?");
    params.push(field);
  }

  if (role) {
    conditions.push("Title LIKE ?");
    params.push(`%${role}%`);
  }

  if (jobType) {
    conditions.push("job_type_id = ?");
    params.push(jobType);
  }

  if (city) {
    conditions.push("city_id = ?");
    params.push(city);
  }

  const whereClause =
    conditions.length > 0
      ? "WHERE " + conditions.join(" AND ") + " AND "
      : "WHERE ";

  const query = `
    SELECT
      JobID,
      Title as JobTitle,
      Description,
      Requirements,
      Salary,
      Location as CityName,
      PostDate as CreatedAt,
      Status
    FROM jobs
    ${whereClause} Status = 'open'
    ORDER BY PostDate DESC
    LIMIT 50
  `;

  console.log("Executing query:", query);
  console.log("With params:", params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`Found ${results.length} jobs`);
    res.json(results || []);
  });
});

// Free search endpoint
app.get("/api/jobs/free-search", (req, res) => {
  const { query } = req.query;
  console.log("Free search request:", query);

  if (!query) {
    return res.json([]);
  }

  const searchQuery = `
    SELECT
      JobID,
      Title as JobTitle,
      Description,
      Requirements,
      Salary,
      Location as CityName,
      PostDate as CreatedAt,
      Status
    FROM jobs
    WHERE Status = 'open' AND (
      Title LIKE ? OR
      Description LIKE ? OR
      Requirements LIKE ? OR
      Location LIKE ?
    )
    ORDER BY PostDate DESC
    LIMIT 50
  `;

  const searchTerm = `%${query}%`;
  const params = [searchTerm, searchTerm, searchTerm, searchTerm];

  db.query(searchQuery, params, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`Found ${results.length} jobs for free search`);
    res.json(results || []);
  });
});

// Get all jobs endpoint
app.get("/api/jobs", (req, res) => {
  const query = `
    SELECT
      JobID,
      Title as JobTitle,
      Description,
      Requirements,
      Salary,
      Location as CityName,
      PostDate as CreatedAt,
      Status
    FROM jobs
    WHERE Status = 'open'
    ORDER BY PostDate DESC
    LIMIT 50
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log(`Found ${results.length} jobs`);
    res.json(results || []);
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date() });
});

// Start server
app.listen(PORT, (err) => {
  if (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
  console.log(`Test server running on port ${PORT}`);
});
