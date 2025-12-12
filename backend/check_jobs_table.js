const db = require('./db');

// Check jobs table structure
db.query('DESCRIBE jobs', (err, results) => {
  if (err) {
    console.error('Error describing jobs table:', err.message);
    
    // Check if we have the legacy job table instead
    db.query('DESCRIBE job', (legacyErr, legacyResults) => {
      if (legacyErr) {
        console.error('No jobs or job table found:', legacyErr.message);
      } else {
        console.log('Found legacy job table structure:');
        console.table(legacyResults);
      }
      process.exit();
    });
  } else {
    console.log('jobs table structure:');
    console.table(results);
    
    // Check if employer_id column exists
    const hasEmployerId = results.some(col => col.Field === 'employer_id');
    if (!hasEmployerId) {
      console.log('employer_id column is missing, checking what columns we have...');
      
      // Check if we have a different column name
      const possibleEmployerColumns = results.filter(col => 
        col.Field.toLowerCase().includes('employer') || 
        col.Field.toLowerCase().includes('company') ||
        col.Field.toLowerCase().includes('user')
      );
      
      console.log('Possible employer-related columns:', possibleEmployerColumns);
      
      // Add employer_id column
      db.query('ALTER TABLE jobs ADD COLUMN employer_id INT', (alterErr) => {
        if (alterErr) {
          console.error('Error adding employer_id column:', alterErr.message);
        } else {
          console.log('employer_id column added successfully');
        }
        process.exit();
      });
    } else {
      console.log('employer_id column exists');
      process.exit();
    }
  }
});
