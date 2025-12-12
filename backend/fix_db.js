const db = require('./db');

async function fixDatabase() {
  console.log('Fixing job_applications table...');
  
  // First, drop the existing table if it exists
  db.query('DROP TABLE IF EXISTS job_applications', (dropErr) => {
    if (dropErr) {
      console.error('Error dropping table:', dropErr.message);
    } else {
      console.log('Old table dropped (if existed)');
    }
    
    // Create the table with proper structure
    const createTableQuery = `
      CREATE TABLE job_applications (
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
        UNIQUE KEY unique_application (job_id, worker_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;
    
    db.query(createTableQuery, (createErr) => {
      if (createErr) {
        console.error('Error creating table:', createErr.message);
        
        // Try without foreign keys
        const simpleCreateQuery = `
          CREATE TABLE job_applications (
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
          )`;
        
        db.query(simpleCreateQuery, (simpleErr) => {
          if (simpleErr) {
            console.error('Error creating simple table:', simpleErr.message);
          } else {
            console.log('job_applications table created successfully (without foreign keys)');
          }
          process.exit();
        });
      } else {
        console.log('job_applications table created successfully!');
        
        // Try to add foreign keys separately
        const addForeignKeys = [
          'ALTER TABLE job_applications ADD CONSTRAINT fk_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE',
          'ALTER TABLE job_applications ADD CONSTRAINT fk_worker_id FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE',
          'ALTER TABLE job_applications ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
          'ALTER TABLE job_applications ADD CONSTRAINT fk_employer_id FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE SET NULL'
        ];
        
        let fkCount = 0;
        addForeignKeys.forEach((query, index) => {
          db.query(query, (fkErr) => {
            fkCount++;
            if (fkErr) {
              console.log(`Warning: Could not add foreign key ${index + 1}: ${fkErr.message}`);
            } else {
              console.log(`Foreign key ${index + 1} added successfully`);
            }
            
            if (fkCount === addForeignKeys.length) {
              console.log('Database fix completed!');
              process.exit();
            }
          });
        });
      }
    });
  });
}

fixDatabase();
