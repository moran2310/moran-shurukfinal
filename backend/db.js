const mysql = require('mysql2');
require('dotenv').config();

/**
 * Cross‑platform MySQL config:
 * - Prefer environment variables.
 * - Use socketPath only on macOS when provided.
 * - On Windows, DO NOT use socketPath (TCP 127.0.0.1:3306 is default).
 */
const isWindows = process.platform === 'win32';
const socketPath = process.env.DB_SOCKET && !isWindows ? process.env.DB_SOCKET : undefined;

// Create database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jobportal',
  port: 3306, // Force port 3306 for Windows
  ...(socketPath ? { socketPath } : {}),
  multipleStatements: true
};

// Debug: Log the configuration being used
console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  env_port: process.env.DB_PORT
});

// Create callback-style connection (main export for backward compatibility)
const db = mysql.createConnection(dbConfig);

// Test connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database at %s:%s', dbConfig.host, dbConfig.port);
});

// Create promise-based connection for async/await usage
const promiseDb = mysql.createConnection(dbConfig).promise();

// Export callback version as default and promise version as property
module.exports = db;
module.exports.promise = promiseDb;
