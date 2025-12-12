const db = require('./db');

async function fixCVSystem() {
  console.log('🔧 Fixing CV System...\n');
  
  // Step 1: Check worker_profiles table structure
  console.log('📊 Checking worker_profiles table...');
  
  await new Promise(resolve => {
    db.query('DESCRIBE worker_profiles', (err, results) => {
      if (err) {
        console.error('Error checking worker_profiles:', err.message);
      } else {
        console.log('Current columns in worker_profiles:');
        results.forEach(col => {
          if (col.Field === 'cv_file' || col.Field === 'cv_filename') {
            console.log(`  - ${col.Field}: ${col.Type}`);
          }
        });
      }
      resolve();
    });
  });

  // Step 2: Ensure cv_file column exists
  await new Promise(resolve => {
    db.query('ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS cv_file VARCHAR(255)', (err) => {
      if (!err) console.log('✅ cv_file column ensured');
      resolve();
    });
  });

  // Step 3: Ensure cv_filename column exists for original filename
  await new Promise(resolve => {
    db.query('ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS cv_filename VARCHAR(255)', (err) => {
      if (!err) console.log('✅ cv_filename column ensured');
      resolve();
    });
  });

  // Step 4: Check job_applications table
  console.log('\n📊 Checking job_applications table...');
  
  await new Promise(resolve => {
    db.query('ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS cv_file_path VARCHAR(255)', (err) => {
      if (!err) console.log('✅ cv_file_path column ensured in job_applications');
      resolve();
    });
  });

  console.log('\n✨ CV System fixed successfully!');
  process.exit(0);
}

fixCVSystem().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
