// Test script to verify pagination functionality
const fetch = require('node-fetch');

async function testPagination() {
  console.log('Testing pagination functionality...');
  
  try {
    // Test first page
    const response1 = await fetch('http://localhost:3000/api/admin/components?page=1&limit=10&sortBy=createdAt&sortOrder=desc');
    
    if (!response1.ok) {
      console.log('✗ API request failed:', response1.status);
      return;
    }
    
    const data1 = await response1.json();
    console.log('✓ API request successful');
    console.log(`✓ Total components: ${data1.pagination.total}`);
    console.log(`✓ Components per page: ${data1.pagination.limit}`);
    console.log(`✓ Total pages: ${data1.pagination.pages}`);
    console.log(`✓ Current page: ${data1.pagination.page}`);
    console.log(`✓ Components on this page: ${data1.components.length}`);
    
    if (data1.pagination.pages > 1) {
      console.log('✓ Multiple pages available - pagination should be visible');
      
      // Test second page
      const response2 = await fetch('http://localhost:3000/api/admin/components?page=2&limit=10&sortBy=createdAt&sortOrder=desc');
      
      if (response2.ok) {
        const data2 = await response2.json();
        console.log(`✓ Page 2 loaded successfully with ${data2.components.length} components`);
        console.log('✓ Pagination functionality is working correctly');
      } else {
        console.log('✗ Failed to load page 2');
      }
    } else {
      console.log('ℹ Only one page of components - pagination not needed');
    }
    
  } catch (error) {
    console.log('✗ Error testing pagination:', error.message);
  }
}

testPagination();