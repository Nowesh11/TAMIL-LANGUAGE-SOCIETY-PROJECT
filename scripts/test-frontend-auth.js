const fetch = require('node-fetch');

async function testFrontendAuth() {
  console.log('🔐 Testing Frontend Authentication Flow...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tamilsociety.org',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   User:', loginData.user.email, '- Role:', loginData.user.role);
    console.log('   Access Token:', loginData.accessToken ? 'Present' : 'Missing');

    const accessToken = loginData.accessToken;

    // Step 2: Test /api/auth/me endpoint
    console.log('\n2. Testing /api/auth/me endpoint...');
    const meResponse = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /api/auth/me successful');
      console.log('   User:', meData.user.email, '- Role:', meData.user.role);
    } else {
      console.log('❌ /api/auth/me failed:', meResponse.status);
    }

    // Step 3: Test components API
    console.log('\n3. Testing components API...');
    const componentsResponse = await fetch('http://localhost:3000/api/admin/components?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (componentsResponse.ok) {
      const componentsData = await componentsResponse.json();
      console.log('✅ Components API successful');
      console.log('   Total Components:', componentsData.pagination?.total || 0);
      console.log('   Components Returned:', componentsData.components?.length || 0);
      console.log('   Stats Available:', componentsData.stats ? 'Yes' : 'No');
      
      if (componentsData.stats) {
        console.log('   Stats:', {
          totalActive: componentsData.stats.totalActive,
          totalInactive: componentsData.stats.totalInactive,
          totalTypes: componentsData.stats.totalTypes
        });
      }
    } else {
      console.log('❌ Components API failed:', componentsResponse.status);
      const errorText = await componentsResponse.text();
      console.log('   Error:', errorText);
    }

    // Step 4: Test dashboard API
    console.log('\n4. Testing dashboard API...');
    const dashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API successful');
      console.log('   Stats Keys:', Object.keys(dashboardData.stats || {}));
    } else {
      console.log('❌ Dashboard API failed:', dashboardResponse.status);
    }

    // Step 5: Test team API
    console.log('\n5. Testing team API...');
    const teamResponse = await fetch('http://localhost:3000/api/admin/team?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      console.log('✅ Team API successful');
      console.log('   Total Team Members:', teamData.pagination?.total || 0);
      console.log('   Team Members Returned:', teamData.team?.length || 0);
    } else {
      console.log('❌ Team API failed:', teamResponse.status);
    }

    console.log('\n🎉 Authentication flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendAuth();