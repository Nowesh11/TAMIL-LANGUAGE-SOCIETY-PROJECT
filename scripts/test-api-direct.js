import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAPIEndpoints() {
  console.log('🧪 Testing API endpoints directly...\n');

  // Test 1: GET /api/admin/components
  console.log('1. Testing GET /api/admin/components');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/components`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (response.status === 401) {
      console.log('   ✅ Expected 401 (authentication required)');
    } else {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n2. Testing POST /api/admin/components (without auth)');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'text',
        page: 'home',
        content: { text: { en: 'Test', ta: 'Test' } }
      })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('   ✅ Expected 401 (authentication required)');
    } else {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n3. Testing PATCH /api/admin/components/test-id (without auth)');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/components/test-id`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: { text: { en: 'Updated Test', ta: 'Updated Test' } }
      })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('   ✅ Expected 401 (authentication required)');
    } else {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n4. Testing PUT /api/admin/components/test-id (should return 405)');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/components/test-id`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: { text: { en: 'Updated Test', ta: 'Updated Test' } }
      })
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 405) {
      console.log('   ✅ Expected 405 (Method Not Allowed)');
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    } else {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n5. Testing OPTIONS /api/admin/components (CORS preflight)');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/components`, {
      method: 'OPTIONS',
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Allow header: ${response.headers.get('allow')}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n6. Testing OPTIONS /api/admin/components/test-id (CORS preflight)');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/components/test-id`, {
      method: 'OPTIONS',
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Allow header: ${response.headers.get('allow')}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n🎯 Summary:');
  console.log('- If all endpoints return 401 (Unauthorized), the routes are working but require auth');
  console.log('- If PUT returns 405 (Method Not Allowed), the route correctly rejects unsupported methods');
  console.log('- If PATCH returns 401 (not 405), the route supports PATCH method');
  console.log('- Check the browser console for the exact URL being called when the error occurs');
}

testAPIEndpoints().catch(console.error);