
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin_test_999@example.com';
const TEST_PASSWORD = 'password123';

async function testAuth() {
  console.log('--- Phase 2: Authentication & Security Testing ---');

  // 1. Setup Test User in DB
  console.log('1. Setting up test admin user...');
  await mongoose.connect(process.env.MONGODB_URI!);
  
  // Clean up existing test user
  await mongoose.connection.collection('users').deleteOne({ email: TEST_EMAIL });

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  await mongoose.connection.collection('users').insertOne({
    name: 'Test Admin',
    email: TEST_EMAIL,
    passwordHash: hashedPassword,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Test admin user created.');
  await mongoose.disconnect();

  // 2. Test Login API
  console.log('\n2. Testing Login API...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (loginRes.status !== 200) {
      console.error(`❌ Login failed with status ${loginRes.status}`);
      const text = await loginRes.text();
      console.error('Response:', text);
      process.exit(1);
    }

    const loginData = await loginRes.json();
    console.log('✅ Login successful.');
    
    // Extract cookies
    const cookies = loginRes.headers.get('set-cookie');
    if (!cookies || !cookies.includes('refresh_token')) {
      console.error('❌ No refresh_token cookie received!');
      console.log('Cookies:', cookies);
      // Proceeding might fail, but let's try extracting access token from body if available
    } else {
      console.log('✅ refresh_token cookie received.');
    }

    const accessToken = loginData.accessToken;
    if (!accessToken) {
       console.error('❌ No accessToken in response body!');
    } else {
       console.log('✅ accessToken received in body.');
    }

    // 3. Test Protected Admin Route (Dashboard Stats)
    console.log('\n3. Testing Protected Route (/api/admin/dashboard/stats)...');
    // Note: Assuming the API expects Bearer token in header AND/OR cookie.
    // Let's try with Authorization header first.
    
    const protectedRes = await fetch(`${BASE_URL}/api/admin/dashboard`, { // generic dashboard route
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookies || '' 
      }
    });

    if (protectedRes.status === 200) {
      console.log('✅ Protected route access successful (200 OK).');
    } else {
      console.warn(`⚠️ Protected route returned ${protectedRes.status}.`);
      // It might be 404 if the route doesn't exist, or 401/403.
      // Let's try /api/admin/books which definitely exists
       const booksRes = await fetch(`${BASE_URL}/api/admin/books`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': cookies || ''
        }
      });
      if (booksRes.status === 200) {
        console.log('✅ Protected route (/api/admin/books) access successful.');
      } else {
        console.error(`❌ Protected route failed: ${booksRes.status}`);
        console.log(await booksRes.text());
      }
    }

    // 4. Test Unauthorized Access
    console.log('\n4. Testing Unauthorized Access...');
    const unauthRes = await fetch(`${BASE_URL}/api/admin/books`, {
        method: 'GET'
        // No headers
    });
    
    if (unauthRes.status === 401 || unauthRes.status === 403) {
        console.log(`✅ correctly rejected with ${unauthRes.status}.`);
    } else {
        console.error(`❌ Unauthorized request was NOT rejected! Status: ${unauthRes.status}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();
