const fetch = require('node-fetch');

async function testEndpoints() {
  const baseUrl = 'http://localhost:5000';
  
  // Test if server is running
  try {
    const response = await fetch(`${baseUrl}/api/test`);
    console.log('Server test response:', response.status);
  } catch (error) {
    console.log('Server might not be fully started or test endpoint missing');
  }

  // Test apply-with-cv endpoint (should return 401 without auth)
  try {
    const response = await fetch(`${baseUrl}/api/jobs/3/apply-with-cv`, {
      method: 'POST'
    });
    console.log('Apply endpoint status:', response.status);
    if (response.status === 401) {
      console.log('✅ Apply endpoint exists (requires auth)');
    } else if (response.status === 404) {
      console.log('❌ Apply endpoint not found');
    }
  } catch (error) {
    console.log('Error testing apply endpoint:', error.message);
  }
}

// Wait a bit for server to start
setTimeout(testEndpoints, 2000);
