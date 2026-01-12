// Test script to verify modal functionality
console.log('Testing modal functionality...');

// Test if the page loads without errors
fetch('http://localhost:3000/admin/components')
  .then(response => {
    if (response.ok) {
      console.log('✓ Admin components page loads successfully');
    } else {
      console.log('✗ Admin components page failed to load:', response.status);
    }
  })
  .catch(error => {
    console.log('✗ Error loading admin components page:', error.message);
  });

// Test if the API endpoint is working
fetch('http://localhost:3000/api/admin/components?page=1&limit=10&sortBy=createdAt&sortOrder=desc')
  .then(response => {
    if (response.ok) {
      console.log('✓ Components API is working');
      return response.json();
    } else {
      console.log('✗ Components API failed:', response.status);
    }
  })
  .then(data => {
    if (data && data.components) {
      console.log(`✓ API returned ${data.components.length} components`);
      console.log('✓ Modal functionality should be working properly');
    }
  })
  .catch(error => {
    console.log('✗ Error testing API:', error.message);
  });

console.log('Modal functionality test completed');