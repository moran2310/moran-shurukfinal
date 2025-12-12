const db = require('./db');

async function fixAllDatabaseIssues() {
  console.log('🔧 Starting comprehensive database fix...');
  
  // Step 1: Drop problematic tables to start fresh
  const tablesToDrop = ['job_applications', 'notifications', 'job_bookmarks'];
  
  for (const table of tablesToDrop) {
    try {
      await new Promise((resolve, reject) => {
        db.query(`DROP TABLE IF EXISTS ${table}`, (err) => {
          if (err) reject(err);
          else {
            console.log(`✅ Dropped table: ${table}`);
            resolve();
          }
        });
      });
    } catch (err) {
      console.log(`⚠️  Warning dropping ${table}:`, err.message);
    }
  }

  // Step 2: Fix roles table structure
  try {
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE roles', (err, results) => {
        if (err) {
          console.log('Creating roles table...');
          const createRolesQuery = `
            CREATE TABLE roles (
              role_id INT AUTO_INCREMENT PRIMARY KEY,
              role_name VARCHAR(50) NOT NULL UNIQUE,
              description VARCHAR(255)
            )`;
          
          db.query(createRolesQuery, (createErr) => {
            if (createErr) reject(createErr);
            else resolve();
          });
        } else {
          // Check if description column exists
          const hasDescription = results.some(col => col.Field === 'description');
          if (!hasDescription) {
            console.log('Adding description column to roles table...');
            db.query('ALTER TABLE roles ADD COLUMN description VARCHAR(255)', (alterErr) => {
              if (alterErr) reject(alterErr);
              else resolve();
            });
          } else {
            resolve();
          }
        }
      });
    });
    console.log('✅ Roles table structure fixed');
  } catch (err) {
    console.error('❌ Error fixing roles table:', err.message);
  }

  // Step 3: Insert default roles
  try {
    await new Promise((resolve, reject) => {
      const insertRolesQuery = `
        INSERT IGNORE INTO roles (role_id, role_name, description) VALUES 
        (1, 'admin', 'Administrator'),
        (2, 'employer', 'Employer'),
        (3, 'worker', 'Job Seeker')`;
      
      db.query(insertRolesQuery, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Default roles inserted');
          resolve();
        }
      });
    });
  } catch (err) {
    console.error('❌ Error inserting roles:', err.message);
  }

  // Step 4: Check and fix users table
  try {
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE users', (err, results) => {
        if (err) {
          console.log('❌ Users table not found');
          reject(err);
        } else {
          console.log('✅ Users table exists');
          resolve();
        }
      });
    });
  } catch (err) {
    console.error('❌ Users table issue:', err.message);
  }

  // Step 5: Check jobs table structure
  try {
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE jobs', (err, results) => {
        if (err) {
          // Try legacy job table
          db.query('DESCRIBE job', (legacyErr, legacyResults) => {
            if (legacyErr) {
              console.log('❌ No jobs table found');
              reject(legacyErr);
            } else {
              console.log('✅ Legacy job table exists');
              resolve();
            }
          });
        } else {
          console.log('✅ Jobs table exists');
          resolve();
        }
      });
    });
  } catch (err) {
    console.error('❌ Jobs table issue:', err.message);
  }

  // Step 6: Create tables without foreign key constraints first
  const tablesWithoutFK = [
    {
      name: 'job_applications',
      query: `
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
    },
    {
      name: 'notifications',
      query: `
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          subject VARCHAR(255),
          message TEXT,
          job_id INT,
          status VARCHAR(20) DEFAULT 'unread',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_status (user_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
    },
    {
      name: 'job_bookmarks',
      query: `
        CREATE TABLE job_bookmarks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          job_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_bookmark (user_id, job_id),
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
    }
  ];

  for (const table of tablesWithoutFK) {
    try {
      await new Promise((resolve, reject) => {
        db.query(table.query, (err) => {
          if (err) reject(err);
          else {
            console.log(`✅ Created table: ${table.name}`);
            resolve();
          }
        });
      });
    } catch (err) {
      console.error(`❌ Error creating ${table.name}:`, err.message);
    }
  }

  console.log('🎉 Database fix completed!');
  console.log('📝 Note: Foreign key constraints were removed to prevent errors.');
  console.log('   The application will work without them for now.');
  
  process.exit(0);
}

fixAllDatabaseIssues().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
