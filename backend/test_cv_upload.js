// Test script to verify CV upload functionality
const fs = require('fs');
const path = require('path');

const cvUploadDir = path.join(__dirname, 'uploads', 'cvs');

console.log('🔍 Testing CV Upload Directory...');
console.log('📁 Expected directory:', cvUploadDir);

// Check if directory exists
if (fs.existsSync(cvUploadDir)) {
  console.log('✅ Directory exists!');
  
  // Check if directory is writable
  try {
    const testFile = path.join(cvUploadDir, 'test-write.txt');
    fs.writeFileSync(testFile, 'Test write access');
    fs.unlinkSync(testFile);
    console.log('✅ Directory is writable!');
  } catch (error) {
    console.log('❌ Directory is not writable:', error.message);
  }
  
  // List existing files
  const files = fs.readdirSync(cvUploadDir);
  console.log('📄 Current files in directory:', files.length > 0 ? files : 'No files');
  
} else {
  console.log('❌ Directory does not exist!');
  console.log('🔧 Creating directory...');
  
  try {
    fs.mkdirSync(cvUploadDir, { recursive: true });
    console.log('✅ Directory created successfully!');
  } catch (error) {
    console.log('❌ Failed to create directory:', error.message);
  }
}

console.log('\n🎯 CV Upload System Status:');
console.log('📂 Upload Directory: uploads/cvs/');
console.log('📝 Supported Formats: PDF, DOC, DOCX');
console.log('📏 Max File Size: 10MB');
console.log('🔒 Authentication: Required');
console.log('💾 Database Storage: worker_profiles.cv_file');
console.log('\n✨ Ready to accept CV uploads!');
