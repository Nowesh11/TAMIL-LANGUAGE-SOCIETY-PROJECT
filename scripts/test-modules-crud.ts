
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin_test_999@example.com';
const TEST_PASSWORD = 'password123';

let accessToken = '';
let cookieHeader = '';
let userId = '';

async function login() {
  console.log('🔑 Logging in...');
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  
  if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.accessToken;
  userId = data.user.id; // Capture User ID
  cookieHeader = res.headers.get('set-cookie') || '';
  console.log('✅ Logged in. User ID:', userId);
}

async function request(method, endpoint, body = null) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Cookie': cookieHeader
  };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

async function testDashboard() {
  console.log('\n📊 Testing Module 1: Dashboard');
  const res = await request('GET', '/api/admin/dashboard');
  if (res.status === 200) {
    console.log('✅ GET /api/admin/dashboard - OK');
  } else {
    console.error(`❌ GET Dashboard failed: ${res.status}`);
  }
}

async function testComponents() {
  console.log('\n🧩 Testing Module 2: Components');
  let createdId = '';
  const newComp = {
    name: 'Test Component ' + Date.now(),
    type: 'hero',
    page: 'home',
    content: { 
      title: { en: 'Test Title', ta: 'சோதனை' },
      description: { en: 'Test Desc', ta: 'விளக்கம்' }
    },
    category: 'testing'
  };
  const createRes = await request('POST', '/api/admin/components', newComp);
  if (createRes.status === 201 || createRes.status === 200) {
    const data = await createRes.json();
    createdId = data._id || data.id || data.data?._id;
    console.log(`✅ CREATE Component - OK (ID: ${createdId})`);
  } else {
    console.error(`❌ CREATE Component failed: ${createRes.status}`);
    return;
  }

  const listRes = await request('GET', '/api/admin/components');
  if (listRes.status === 200) console.log('✅ READ Components List - OK');
  
  const updateRes = await request('PATCH', `/api/admin/components/${createdId}`, {
    name: 'Updated Component Name'
  });
  if (updateRes.status === 200) console.log('✅ UPDATE Component - OK');
  else console.error(`❌ UPDATE Component failed: ${updateRes.status}`);

  const delRes = await request('DELETE', `/api/admin/components/${createdId}`);
  if (delRes.status === 200 || delRes.status === 204) console.log('✅ DELETE Component - OK');
  else console.error(`❌ DELETE Component failed: ${delRes.status}`);
}

async function testPosters() {
  console.log('\n🖼️ Testing Module 3: Posters');
  const listRes = await request('GET', '/api/admin/posters');
  if (listRes.status === 200) console.log('✅ READ Posters List - OK');
  else console.error(`❌ READ Posters failed: ${listRes.status}`);
}

async function testTeam() {
  console.log('\n👥 Testing Module 4: Team');
  const newMember = {
    name: { en: 'Test Member', ta: 'உறுப்பினர்' },
    role: 'Executive Committee',
    position: { en: 'Committee Member', ta: 'உறுப்பினர்' }, // Required by Route
    bio: { en: 'Test Bio', ta: 'வாழ்க்கை வரலாறு' },
    email: `test${Date.now()}@example.com`,
    orderNum: 999,
    slug: `test-member-${Date.now()}`
  };
  
  const createRes = await request('POST', '/api/admin/team', newMember);
  let id = '';
  if (createRes.status === 201 || createRes.status === 200) {
    const data = await createRes.json();
    id = data._id || data.id || data.data?._id;
    console.log(`✅ CREATE Team Member - OK (ID: ${id})`);
  } else {
    console.error(`❌ CREATE Team Member failed: ${createRes.status}`);
    console.log(await createRes.text());
  }

  const listRes = await request('GET', '/api/admin/team');
  if (listRes.status === 200) console.log('✅ READ Team List - OK');
  
  if (id) {
    const delRes = await request('DELETE', `/api/admin/team?id=${id}`); // Route uses ?id=...
    if (delRes.status === 200) console.log('✅ DELETE Team Member - OK');
    else console.error(`❌ DELETE Team Member failed: ${delRes.status}`);
  }
}

async function testBooks() {
  console.log('\n📚 Testing Module 5: Books');
  const newBook = {
    title: { en: 'Test Book', ta: 'புத்தகம்' },
    author: { en: 'Test Author', ta: 'ஆசிரியர்' },
    description: { en: 'Desc', ta: 'விளக்கம்' },
    isbn: `978-3-16-148410-${Math.floor(Math.random() * 10)}`,
    price: 19.99,
    stock: 10,
    category: 'Fiction',
    coverPath: '/uploads/placeholder.jpg',
    language: 'english',
    createdBy: userId // Required by Schema, missing in Route logic? We send it anyway.
  };
  const createRes = await request('POST', '/api/admin/books', newBook);
  let id = '';
  if (createRes.status === 201 || createRes.status === 200) {
    const data = await createRes.json();
    id = data._id || data.id || data.data?._id;
    console.log(`✅ CREATE Book - OK (ID: ${id})`);
  } else {
    console.error(`❌ CREATE Book failed: ${createRes.status}`);
    console.log(await createRes.text());
  }

  const listRes = await request('GET', '/api/admin/books');
  if (listRes.status === 200) console.log('✅ READ Books List - OK');

  if (id) {
    const delRes = await request('DELETE', `/api/admin/books?id=${id}`); // Route uses ?id=...
    if (delRes.status === 200) console.log('✅ DELETE Book - OK');
    else console.error(`❌ DELETE Book failed: ${delRes.status}`);
  }
}

async function testEBooks() {
  console.log('\n📱 Testing Module 6: EBooks');
  const listRes = await request('GET', '/api/admin/ebooks');
  if (listRes.status === 200) console.log('✅ READ EBooks List - OK');
}

async function testProjectItems() {
  console.log('\n🏗️ Testing Module 7: Project Items');
  const newProject = {
    type: 'project',
    title: { en: 'Test Project', ta: 'திட்டம்' },
    shortDesc: { en: 'Short', ta: 'குறுகிய' },
    fullDesc: { en: 'Full', ta: 'முழு' },
    goals: { en: 'Goals', ta: 'இலக்குகள்' },
    directorName: { en: 'Director', ta: 'இயக்குனர்' },
    status: 'planning',
    category: 'community',
    createdBy: userId // Just in case
  };
  const createRes = await request('POST', '/api/admin/project-items', newProject);
  let id = '';
  if (createRes.status === 201 || createRes.status === 200) {
     const data = await createRes.json();
     id = data._id || data.id || data.data?._id;
     console.log(`✅ CREATE Project Item - OK (ID: ${id})`);
  } else {
     console.error(`❌ CREATE Project Item failed: ${createRes.status}`);
     console.log(await createRes.text());
  }

  const listRes = await request('GET', '/api/admin/project-items');
  if (listRes.status === 200) console.log('✅ READ Project Items List - OK');

  if (id) {
      // Assuming DELETE uses ID in path or query. Let's check Schema... 
      // Actually standard is often [id], but Team/Book used ?id. 
      // Project Items usually uses [id]. Let's try [id] first.
      const delRes = await request('DELETE', `/api/admin/project-items/${id}`);
      if (delRes.status === 200) console.log('✅ DELETE Project Item - OK');
      else {
          // Fallback to query param
          const delRes2 = await request('DELETE', `/api/admin/project-items?id=${id}`);
          if (delRes2.status === 200) console.log('✅ DELETE Project Item - OK (Query Param)');
          else console.error(`❌ DELETE Project Item failed: ${delRes.status}`);
      }
  }
}

async function testRecruitment() {
  console.log('\n🤝 Testing Module 8: Recruitment (Recruitment Forms)');
  const newForm = {
    title: { en: 'Test Form', ta: 'படிவம்' },
    description: { en: 'Desc', ta: 'விளக்கம்' },
    isActive: true,
    fields: [
        {
            id: 'field_1',
            type: 'text',
            label: { en: 'Name', ta: 'பெயர்' },
            required: true,
            order: 1
        }
    ]
  };
  const createRes = await request('POST', '/api/admin/recruitment-forms', newForm);
  let id = '';
  if (createRes.status === 201 || createRes.status === 200) {
    const data = await createRes.json();
    id = data._id || data.id || data.data?._id;
    console.log(`✅ CREATE Recruitment Form - OK (ID: ${id})`);
  } else {
    console.error(`❌ CREATE Recruitment Form failed: ${createRes.status}`);
    console.log(await createRes.text());
  }
  
  const listRes = await request('GET', '/api/admin/recruitment-forms');
  if (listRes.status === 200) console.log('✅ READ Recruitment Forms List - OK');

  if (id) {
     const delRes = await request('DELETE', `/api/admin/recruitment-forms?id=${id}`);
     if (delRes.status === 200) console.log('✅ DELETE Recruitment Form - OK');
     else console.error(`❌ DELETE Recruitment Form failed: ${delRes.status}`);
  }
}

async function testFileRecords() {
    console.log('\n📂 Testing Module 9: File Records');
    const listRes = await request('GET', '/api/admin/files');
    if (listRes.status === 200) console.log('✅ READ File Records List - OK');
}

async function testChat() {
    console.log('\n💬 Testing Module 10: Chat');
    const listRes = await request('GET', '/api/admin/chat/conversations');
    if (listRes.status === 200) console.log('✅ READ Chat Conversations - OK');
}

async function testNotifications() {
    console.log('\n🔔 Testing Module 11: Notifications');
    const newNotif = {
        title: { en: 'Test', ta: 'Test' },
        message: { en: 'Msg', ta: 'Msg' },
        type: 'info',
        targetAudience: 'all'
    };
    const createRes = await request('POST', '/api/notifications', newNotif);
    let id = '';
    if (createRes.status === 201 || createRes.status === 200) {
        const data = await createRes.json();
        id = data.notification?._id || data.data?._id; 
        console.log(`✅ CREATE Notification - OK`);
    } else {
        console.error(`❌ CREATE Notification failed: ${createRes.status}`);
    }

    const listRes = await request('GET', '/api/notifications');
    if (listRes.status === 200) console.log('✅ READ Notifications List - OK');
    
    if (id) {
        const delRes = await request('DELETE', `/api/notifications?id=${id}`);
        if (delRes.status === 200) console.log('✅ DELETE Notification - OK');
    }
}

async function testPaymentSettings() {
    console.log('\n💳 Testing Module 12: Payment Settings');
    const listRes = await request('GET', '/api/admin/payment-settings');
    if (listRes.status === 200) console.log('✅ READ Payment Settings - OK');
}

async function run() {
  try {
    await login();
    await testDashboard();
    await testComponents();
    await testPosters();
    await testTeam();
    await testBooks();
    await testEBooks();
    await testProjectItems();
    await testRecruitment();
    await testFileRecords();
    await testChat();
    await testNotifications();
    await testPaymentSettings();
  } catch (e) {
    console.error('Test Suite Failed:', e);
  }
}

run();
