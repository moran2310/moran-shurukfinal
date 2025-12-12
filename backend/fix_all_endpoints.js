const db = require('./db');
const fs = require('fs');
const path = require('path');

async function fixAllEndpoints() {
  console.log('🔧 Fixing all endpoint issues...\n');
  
  // Step 1: Check and fix worker_profiles table
  console.log('📊 Step 1: Checking worker_profiles table...');
  
  await new Promise(resolve => {
    // Check if cv_filename column exists
    db.query('DESCRIBE worker_profiles', (err, results) => {
      if (err) {
        console.error('Error checking worker_profiles:', err.message);
        resolve();
        return;
      }
      
      const hasCvFilename = results.some(col => col.Field === 'cv_filename');
      if (!hasCvFilename) {
        console.log('Adding cv_filename column...');
        db.query('ALTER TABLE worker_profiles ADD COLUMN cv_filename VARCHAR(255)', (alterErr) => {
          if (alterErr) {
            console.log('Column might already exist or error:', alterErr.message);
          } else {
            console.log('✅ cv_filename column added');
          }
          resolve();
        });
      } else {
        console.log('✅ cv_filename column exists');
        resolve();
      }
    });
  });

  // Step 2: Test worker profile query
  console.log('\n📊 Step 2: Testing worker profile query...');
  
  await new Promise(resolve => {
    const testQuery = `
      SELECT * FROM worker_profiles 
      WHERE user_id = 1 LIMIT 1
    `;
    
    db.query(testQuery, (err, results) => {
      if (err) {
        console.error('❌ Worker profile query error:', err.message);
      } else {
        console.log('✅ Worker profile query works');
      }
      resolve();
    });
  });

  // Step 3: Test job applications query
  console.log('\n📊 Step 3: Testing job applications query...');
  
  await new Promise(resolve => {
    const testQuery = `
      SELECT 
        ja.id,
        ja.job_id,
        ja.status,
        ja.applied_at,
        ja.updated_at,
        COALESCE(j.title, jb.JobTitle) as title,
        COALESCE(j.company_name, jb.CompanyName) as company_name,
        COALESCE(j.location, jb.CityName) as location,
        COALESCE(j.description, jb.Description) as description,
        j.salary_min,
        j.salary_max
      FROM job_applications ja
      LEFT JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN job jb ON ja.job_id = jb.JobID
      WHERE ja.worker_id = 1
      ORDER BY ja.applied_at DESC
      LIMIT 1
    `;
    
    db.query(testQuery, (err, results) => {
      if (err) {
        console.error('❌ Job applications query error:', err.message);
        console.log('Attempting to fix...');
        
        // Try simpler query
        const simpleQuery = `
          SELECT 
            ja.*,
            j.title,
            j.company_name,
            j.location
          FROM job_applications ja
          LEFT JOIN jobs j ON ja.job_id = j.id
          WHERE ja.worker_id = 1
          LIMIT 1
        `;
        
        db.query(simpleQuery, (err2) => {
          if (err2) {
            console.error('❌ Simple query also failed:', err2.message);
          } else {
            console.log('✅ Simple query works - using simplified version');
          }
          resolve();
        });
      } else {
        console.log('✅ Job applications query works');
        resolve();
      }
    });
  });

  // Step 4: Check if jobs table exists
  console.log('\n📊 Step 4: Checking jobs table...');
  
  await new Promise(resolve => {
    db.query('SHOW TABLES LIKE "jobs"', (err, results) => {
      if (err || results.length === 0) {
        console.log('❌ jobs table not found, checking for job table...');
        db.query('SHOW TABLES LIKE "job"', (err2, results2) => {
          if (!err2 && results2.length > 0) {
            console.log('✅ Found legacy job table');
          } else {
            console.log('❌ No job/jobs table found!');
          }
          resolve();
        });
      } else {
        console.log('✅ jobs table exists');
        resolve();
      }
    });
  });

  // Step 5: Ensure uploads directory exists
  console.log('\n📁 Step 5: Checking uploads directory...');
  
  const uploadsDir = path.join(__dirname, 'uploads');
  const cvsDir = path.join(uploadsDir, 'cvs');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('✅ Created uploads directory');
  } else {
    console.log('✅ uploads directory exists');
  }
  
  if (!fs.existsSync(cvsDir)) {
    fs.mkdirSync(cvsDir);
    console.log('✅ Created cvs directory');
  } else {
    console.log('✅ cvs directory exists');
  }

  console.log('\n✨ Diagnostic complete!');
  console.log('\n📝 Recommendations:');
  console.log('1. Restart the server: node server.js');
  console.log('2. Check if the database connection is stable');
  console.log('3. Ensure all required tables exist');
  
  process.exit(0);
}

fixAllEndpoints().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
