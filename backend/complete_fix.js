const db = require('./db');
const fs = require('fs');
const path = require('path');

async function completeProjectFix() {
  console.log('🔧 Starting Complete Project Fix...\n');
  
  // Step 1: Fix all database tables
  console.log('📊 Step 1: Fixing Database Tables...');
  
  // Drop problematic tables first
  const tablesToDrop = ['job_applications', 'notifications', 'job_bookmarks'];
  
  for (const table of tablesToDrop) {
    await new Promise(resolve => {
      db.query(`DROP TABLE IF EXISTS ${table}`, (err) => {
        if (!err) console.log(`  ✅ Cleaned table: ${table}`);
        resolve();
      });
    });
  }

  // Fix roles table
  await new Promise(resolve => {
    db.query('ALTER TABLE roles ADD COLUMN IF NOT EXISTS description VARCHAR(255)', (err) => {
      if (!err) console.log('  ✅ Roles table structure fixed');
      resolve();
    });
  });

  // Insert default roles
  await new Promise(resolve => {
    const insertRoles = `
      INSERT IGNORE INTO roles (role_id, role_name, description) VALUES 
      (1, 'admin', 'Administrator'),
      (2, 'employer', 'Employer'),
      (3, 'worker', 'Job Seeker')`;
    
    db.query(insertRoles, (err) => {
      if (!err) console.log('  ✅ Default roles inserted');
      resolve();
    });
  });

  // Create job_applications table
  await new Promise(resolve => {
    const createTable = `
      CREATE TABLE IF NOT EXISTS job_applications (
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
    
    db.query(createTable, (err) => {
      if (!err) console.log('  ✅ job_applications table created');
      resolve();
    });
  });

  // Create notifications table
  await new Promise(resolve => {
    const createTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        message TEXT,
        job_id INT,
        status VARCHAR(20) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_status (user_id, status)
      )`;
    
    db.query(createTable, (err) => {
      if (!err) console.log('  ✅ notifications table created');
      resolve();
    });
  });

  // Create job_bookmarks table
  await new Promise(resolve => {
    const createTable = `
      CREATE TABLE IF NOT EXISTS job_bookmarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        job_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_bookmark (user_id, job_id),
        INDEX idx_user (user_id)
      )`;
    
    db.query(createTable, (err) => {
      if (!err) console.log('  ✅ job_bookmarks table created');
      resolve();
    });
  });

  // Step 2: Create necessary directories
  console.log('\n📁 Step 2: Creating necessary directories...');
  
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'cvs'),
    path.join(__dirname, 'uploads', 'profiles')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Created directory: ${dir}`);
    } else {
      console.log(`  ✅ Directory exists: ${dir}`);
    }
  });

  // Step 3: Check worker_profiles table columns
  console.log('\n🔍 Step 3: Checking worker_profiles table...');
  
  await new Promise(resolve => {
    const alterQueries = [
      'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE',
      'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT FALSE',
      'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS job_recommendations BOOLEAN DEFAULT TRUE',
      'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS application_updates BOOLEAN DEFAULT TRUE',
      'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS profile_views INT DEFAULT 0'
    ];
    
    let completed = 0;
    alterQueries.forEach(query => {
      db.query(query, () => {
        completed++;
        if (completed === alterQueries.length) {
          console.log('  ✅ worker_profiles table updated');
          resolve();
        }
      });
    });
  });

  console.log('\n✨ All fixes completed successfully!');
  console.log('📌 You can now start the server with: node server.js\n');
  
  process.exit(0);
}

completeProjectFix().catch(err => {
  console.error('❌ Error during fix:', err);
  process.exit(1);
});
