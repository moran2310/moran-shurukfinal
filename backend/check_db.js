const db = require('./db');

// Check job_applications table structure
db.query('DESCRIBE job_applications', (err, results) => {
  if (err) {
    console.error('Error describing job_applications table:', err.message);
    // Try to create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS job_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        worker_id INT NOT NULL,
        user_id INT NOT NULL,
        employer_id INT,
        status ENUM('pending', 'accepted', 'rejected', 'in_review') DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        cv_file_path VARCHAR(255),
        cover_letter TEXT,
        notes TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_application (job_id, worker_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;
    
    db.query(createTableQuery, (createErr) => {
      if (createErr) {
        console.error('Error creating job_applications table:', createErr.message);
      } else {
        console.log('job_applications table created successfully');
      }
      process.exit();
    });
  } else {
    console.log('job_applications table structure:');
    console.table(results);
    
    // Check if user_id column exists
    const hasUserId = results.some(col => col.Field === 'user_id');
    if (!hasUserId) {
      console.log('user_id column is missing, adding it...');
      db.query('ALTER TABLE job_applications ADD COLUMN user_id INT NOT NULL AFTER worker_id', (alterErr) => {
        if (alterErr) {
          console.error('Error adding user_id column:', alterErr.message);
        } else {
          console.log('user_id column added successfully');
          // Update existing records to set user_id = worker_id
          db.query('UPDATE job_applications SET user_id = worker_id WHERE user_id IS NULL OR user_id = 0', (updateErr) => {
            if (updateErr) {
              console.error('Error updating user_id values:', updateErr.message);
            } else {
              console.log('user_id values updated successfully');
            }
            process.exit();
          });
        }
      });
    } else {
      process.exit();
    }
  }
});
