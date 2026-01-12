// Ensure fetch is available in Node (node-fetch v3 is ESM-only)
let fetch = globalThis.fetch;
if (!fetch) {
  try {
    // Try CJS require (works for node-fetch v2)
    const nf = require('node-fetch');
    fetch = nf && nf.default ? nf.default : nf;
  } catch (e) {
    // Fallback to dynamic import for ESM-only node-fetch v3
    fetch = async (...args) => {
      const mod = await import('node-fetch');
      return mod.default(...args);
    };
  }
}

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@tamilsociety.org';
const ADMIN_PASSWORD = 'admin123';

async function testAdminAPIs() {
  console.log('🔐 Testing Admin Authentication and APIs...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      console.error(`❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      const errorText = await loginResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.name.en} (${loginData.user.email})`);
    console.log(`   Role: ${loginData.user.role}`);

    const accessToken = loginData.accessToken;

    // Step 2: Test Components API
    console.log('\n2. Testing Components API...');
    const componentsResponse = await fetch(`${BASE_URL}/api/admin/components?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (componentsResponse.ok) {
      const componentsData = await componentsResponse.json();
      console.log('✅ Components API working');
      console.log(`   Total components: ${componentsData.total || 0}`);
      console.log(`   Components returned: ${componentsData.data?.length || 0}`);
      
      if (componentsData.data && componentsData.data.length > 0) {
        console.log('   Sample component types:');
        componentsData.data.slice(0, 3).forEach((comp, index) => {
          console.log(`     ${index + 1}. Type: ${comp.type}, Page: ${comp.page}, Active: ${comp.isActive}`);
        });
      }
    } else {
      console.error(`❌ Components API failed: ${componentsResponse.status}`);
      const errorText = await componentsResponse.text();
      console.error('Error details:', errorText);
    }

    // Step 3: Test Team API
    console.log('\n3. Testing Team API...');
    const teamResponse = await fetch(`${BASE_URL}/api/admin/team?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      console.log('✅ Team API working');
      console.log(`   Total team members: ${teamData.total || 0}`);
      console.log(`   Team members returned: ${teamData.data?.length || 0}`);
      
      if (teamData.data && teamData.data.length > 0) {
        console.log('   Team members:');
        teamData.data.slice(0, 3).forEach((member, index) => {
          console.log(`     ${index + 1}. ID: ${member._id}, Name: ${member.name?.en || 'No name'}, Active: ${member.isActive}`);
          if (member.imagePath) {
            console.log(`        Image: ${member.imagePath}`);
          }
        });
      }
    } else {
      console.error(`❌ Team API failed: ${teamResponse.status}`);
      const errorText = await teamResponse.text();
      console.error('Error details:', errorText);
    }

    // Step 4: Test Posters API
    console.log('\n4. Testing Posters API...');
    const postersResponse = await fetch(`${BASE_URL}/api/admin/posters?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (postersResponse.ok) {
      const postersData = await postersResponse.json();
      console.log('✅ Posters API working');
      console.log(`   Total posters: ${postersData.total || 0}`);
      console.log(`   Posters returned: ${postersData.data?.length || 0}`);
    } else {
      console.error(`❌ Posters API failed: ${postersResponse.status}`);
      const errorText = await postersResponse.text();
      console.error('Error details:', errorText);
    }

    // Step 5: Test Dashboard Stats API
    console.log('\n5. Testing Dashboard Stats API...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API working');
      console.log('   Stats:');
      Object.entries(dashboardData.stats || {}).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    } else {
      console.error(`❌ Dashboard API failed: ${dashboardResponse.status}`);
      const errorText = await dashboardResponse.text();
      console.error('Error details:', errorText);
    }

    // Step 6: Test specific team image that was failing
    console.log('\n6. Testing Team Image API...');
    const teamImageResponse = await fetch(`${BASE_URL}/api/team/image?id=68f8f40d5656a1697a135595`);
    
    if (teamImageResponse.ok) {
      console.log('✅ Team image API working for valid ID');
    } else {
      console.log(`❌ Team image API failed for valid ID: ${teamImageResponse.status}`);
    }

    // Test with invalid ID
    const invalidImageResponse = await fetch(`${BASE_URL}/api/team/image?id=68f8f40d5656a1697a135596`);
    if (invalidImageResponse.status === 404) {
      console.log('✅ Team image API correctly returns 404 for invalid ID');
    } else {
      console.log(`❌ Unexpected response for invalid ID: ${invalidImageResponse.status}`);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAdminAPIs();