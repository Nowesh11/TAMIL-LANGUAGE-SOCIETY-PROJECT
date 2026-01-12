// Test API endpoints for admin functionality
const https = require('https');
const http = require('http');

// Test function to check API endpoints
function testApiEndpoint(url, method = 'GET', expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include authentication headers
      }
    };
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode === expectedStatus,
          url: url,
          dataLength: data.length,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });
    
    req.on('error', (err) => {
      reject({
        status: 0,
        success: false,
        url: url,
        error: err.message
      });
    });
    
    req.end();
  });
}

// Test admin API endpoints
async function testAdminApiEndpoints() {
  const baseUrl = 'http://localhost:3000';
  const apiEndpoints = [
    '/api/admin/dashboard',
    '/api/admin/components',
    '/api/admin/posters',
    '/api/admin/team',
    '/api/admin/project-items',
    '/api/admin/recruitment-forms'
  ];
  
  console.log('Testing admin API endpoints...');
  
  for (const endpoint of apiEndpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const result = await testApiEndpoint(`${baseUrl}${endpoint}`);
      console.log(`✓ ${endpoint}: Status ${result.status}, Data length: ${result.dataLength}`);
      if (result.data) {
        console.log(`  Response preview: ${result.data}...`);
      }
    } catch (error) {
      console.log(`✗ ${endpoint}: Error - ${error.error}`);
    }
  }
  
  console.log('Admin API endpoints test completed!');
}

// Run the test
testAdminApiEndpoints().catch(console.error);