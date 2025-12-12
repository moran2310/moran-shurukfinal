const fs = require('fs');
const path = require('path');

// Read the server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the problematic apply-with-cv endpoint and fix it
const startMarker = '// Apply for a job with CV upload';
const endMarker = '// Get worker\'s job applications';

const startIndex = serverContent.indexOf(startMarker);
const endIndex = serverContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  // Extract the parts before and after the problematic section
  const beforeSection = serverContent.substring(0, startIndex);
  const afterSection = serverContent.substring(endIndex);
  
  // Create the fixed endpoint
  const fixedEndpoint = `// Apply for a job with CV upload
app.post('/api/jobs/:jobId/apply-with-cv', verifyToken, upload.single('cv'), async (req, res) => {
  console.log('=== Job Application Endpoint Called ===');
  console.log('Job ID:', req.params.jobId);
  console.log('User:', req.user);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  const jobId = req.params.jobId;
  const workerId = req.user.userId;
  const { coverLetter, useExistingCV } = req.body;

  try {
    // Check if user has worker role
    const checkRoleQuery = \`
      SELECT r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.id = ?
    \`;

    db.query(checkRoleQuery, [workerId], (err, roleResults) => {
      if (err) {
        console.error('Error checking user role:', err);
        return res.status(500).json({ error: 'Database error checking role', details: err.message });
      }

      console.log('Role check results:', roleResults);
      if (roleResults.length === 0 || roleResults[0].role_name !== 'worker') {
        console.log('User is not a worker or not found');
        return res.status(403).json({ error: 'Only workers can apply for jobs' });
      }

      // Check if already applied
      const checkApplicationQuery = 'SELECT id FROM job_applications WHERE job_id = ? AND worker_id = ?';
      db.query(checkApplicationQuery, [jobId, workerId], (err, existingResults) => {
        if (err) {
          console.error('Error checking existing application:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingResults.length > 0) {
          return res.status(400).json({ error: 'כבר הגשת מועמדות למשרה זו' });
        }

        // Check if job exists
        const getJobQuery = 'SELECT id FROM jobs WHERE id = ? UNION SELECT JobID as id FROM job WHERE JobID = ?';
        db.query(getJobQuery, [jobId, jobId], (err, jobResults) => {
          if (err || jobResults.length === 0) {
            return res.status(404).json({ error: 'משרה לא נמצאה' });
          }

          const employerId = null; // Set to null for now

          // Handle CV file path
          let cvFilePath = null;
          
          const processApplication = () => {
            // Create application with CV
            const insertApplicationQuery = \`
              INSERT INTO job_applications (
                job_id, 
                worker_id, 
                user_id,
                employer_id,
                status, 
                applied_at, 
                cv_file_path,
                cover_letter
              )
              VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?)
            \`;

            db.query(insertApplicationQuery, [
              jobId, 
              workerId, 
              workerId,
              employerId,
              cvFilePath,
              coverLetter || null
            ], (err, results) => {
              if (err) {
                console.error('Error creating application:', err);
                return res.status(500).json({ error: 'Failed to submit application' });
              }

              console.log('Application created successfully');

              res.json({
                success: true,
                message: 'המועמדות הוגשה בהצלחה!',
                applicationId: results.insertId,
                cvUploaded: !!cvFilePath
              });
            });
          };

          if (useExistingCV === 'true') {
            // Get existing CV from worker profile
            const getProfileQuery = 'SELECT cv_file FROM worker_profiles WHERE user_id = ?';
            db.query(getProfileQuery, [workerId], (err, profileResults) => {
              if (err || !profileResults || profileResults.length === 0 || !profileResults[0].cv_file) {
                return res.status(400).json({ error: 'לא נמצא קובץ CV בפרופיל שלך' });
              }
              
              cvFilePath = profileResults[0].cv_file;
              processApplication();
            });
          } else if (req.file) {
            cvFilePath = path.join('uploads', 'cvs', req.file.filename);
            
            // Update worker profile with CV
            const updateProfileQuery = \`
              INSERT INTO worker_profiles (user_id, cv_file) 
              VALUES (?, ?) 
              ON DUPLICATE KEY UPDATE cv_file = ?
            \`;
            
            db.query(updateProfileQuery, [workerId, cvFilePath, cvFilePath], (err) => {
              if (err) {
                console.error('Error updating worker profile:', err);
              }
            });
            
            processApplication();
          } else {
            return res.status(400).json({ error: 'חובה להעלות קובץ CV או לבחור להשתמש בקובץ קיים' });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in job application:', error);
    res.status(500).json({ error: 'שגיאה בהגשת המועמדות' });
  }
});

`;
  
  // Combine the fixed content
  const fixedContent = beforeSection + fixedEndpoint + afterSection;
  
  // Write the fixed content back to server.js
  fs.writeFileSync(serverPath, fixedContent, 'utf8');
  console.log('✅ Fixed the apply-with-cv endpoint successfully!');
} else {
  console.error('❌ Could not find the markers to fix the endpoint');
}
