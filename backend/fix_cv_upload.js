const fs = require('fs');
const path = require('path');

// Read the server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find and replace the /api/worker/upload-cv endpoint
const uploadCVEndpoint = `
// Upload CV for worker profile
app.post('/api/worker/upload-cv', verifyToken, upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const userId = req.user.userId;
  const cvPath = path.join('uploads', 'cvs', req.file.filename);
  const cvFilename = req.file.originalname;
  
  console.log('CV Upload - User ID:', userId);
  console.log('CV Upload - File path:', cvPath);
  console.log('CV Upload - Original filename:', cvFilename);
  
  // Update worker profile with CV
  const checkQuery = 'SELECT id FROM worker_profiles WHERE user_id = ?';
  
  db.query(checkQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error checking worker profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    let query;
    let params;
    
    if (results.length > 0) {
      // Update existing profile
      query = \`
        UPDATE worker_profiles 
        SET cv_file = ?, cv_filename = ?
        WHERE user_id = ?
      \`;
      params = [cvPath, cvFilename, userId];
    } else {
      // Create new profile with CV
      query = \`
        INSERT INTO worker_profiles (user_id, cv_file, cv_filename) 
        VALUES (?, ?, ?)
      \`;
      params = [userId, cvPath, cvFilename];
    }
    
    db.query(query, params, (err2) => {
      if (err2) {
        console.error('Error saving CV to profile:', err2);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('CV saved successfully for user:', userId);
      res.json({ 
        success: true, 
        message: 'CV uploaded successfully', 
        path: cvPath,
        filename: cvFilename
      });
    });
  });
});`;

// Find the existing upload-cv endpoint and replace it
const startMarker = '// Upload CV for worker profile';
const endMarker = '// Get/Set notification settings';

const startIndex = serverContent.indexOf(startMarker);
const endIndex = serverContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const beforeSection = serverContent.substring(0, startIndex);
  const afterSection = serverContent.substring(endIndex);
  
  const fixedContent = beforeSection + uploadCVEndpoint + '\n\n' + afterSection;
  
  fs.writeFileSync(serverPath, fixedContent, 'utf8');
  console.log('✅ Fixed CV upload endpoint!');
} else {
  console.log('❌ Could not find markers to fix the endpoint');
}
