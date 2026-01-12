// Simple test script to verify admin functionality
const https = require('https');
const http = require('http');

// Test function to check if pages are accessible
function testPage(url, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode === expectedStatus,
          url: url,
          dataLength: data.length
        });
      });
    }).on('error', (err) => {
      reject({
        status: 0,
        success: false,
        url: url,
        error: err.message
      });
    });
  });
}

// Test admin pages
async function testAdminPages() {
  const baseUrl = 'http://localhost:3000';
  const adminPages = [
    '/admin/dashboard',
    '/admin/components',
    '/admin/posters',
    '/admin/team',
    '/admin/project-items',
    '/admin/recruitment'
  ];
  
  console.log('Testing admin pages functionality...');
  
  for (const page of adminPages) {
    try {
      console.log(`Testing ${page}...`);
      const result = await testPage(`${baseUrl}${page}`);
      console.log(`✓ ${page}: Status ${result.status}, Data length: ${result.dataLength}`);
    } catch (error) {
      console.log(`✗ ${page}: Error - ${error.error}`);
    }
  }
  
  console.log('Admin pages test completed!');
}

// Run the test
testAdminPages().catch(console.error);