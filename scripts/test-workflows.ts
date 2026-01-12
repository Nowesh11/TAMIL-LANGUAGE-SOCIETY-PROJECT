
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin_test_999@example.com';
const TEST_PASSWORD = 'password123';

let accessToken = '';
let userId = '';
let cookieHeader = '';

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
  userId = data.user.id;
  cookieHeader = res.headers.get('set-cookie') || '';
  console.log('✅ Logged in. User ID:', userId);
}

async function request(method, endpoint, body = null, useAuth = true) {
  const headers = {};
  if (useAuth) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    headers['Cookie'] = cookieHeader;
  }
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

async function testBookPurchaseWorkflow() {
  console.log('\n📚 Testing Workflow 2: Book Purchase');
  
  // 1. Create a Book
  console.log('1. Creating a book with stock = 10...');
  const newBook = {
    title: { en: 'Workflow Book', ta: 'சோதனை புத்தகம்' },
    author: { en: 'Author', ta: 'ஆசிரியர்' },
    description: { en: 'Desc', ta: 'விளக்கம்' },
    isbn: '978-0-596-52068-' + Math.floor(Math.random() * 10), // Valid-ish ISBN-13 format
    price: 100,
    stock: 10,
    category: 'Fiction',
    coverPath: '/uploads/placeholder.jpg',
    language: 'english',
    createdBy: userId
  };
  
  const createRes = await request('POST', '/api/admin/books', newBook);
  if (createRes.status !== 201) {
    console.error('❌ Failed to create book');
    console.log(await createRes.text());
    return;
  }
  const bookData = await createRes.json();
  const bookId = bookData._id || bookData.id || bookData.data?._id || bookData.book?._id;
  console.log(`✅ Book created. ID: ${bookId}, Stock: 10`);

  // 2. Purchase the Book (User API)
  console.log('2. Purchasing 2 copies...');
  const purchasePayload = {
    items: [{ bookId: bookId, quantity: 2 }],
    shippingAddress: {
      fullName: 'Test Buyer',
      addressLine1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country'
    },
    method: 'cash',
    notes: 'Test purchase'
  };
  
  // Need to be logged in as user. Admin token works for purchase API too (it just checks user exists).
  const purchaseRes = await request('POST', '/api/purchases', purchasePayload);
  if (purchaseRes.status !== 200) {
    console.error('❌ Failed to purchase book');
    console.log(await purchaseRes.text());
  } else {
    console.log('✅ Purchase successful.');
  }

  // 3. Verify Stock Reduced
  console.log('3. Verifying stock...');
  // Since we don't have a public GET /api/books/[id] easily without digging, 
  // we can use the admin list and filter, or just use admin endpoint if it supports ID.
  // /api/admin/books returns all. We can filter.
  const listRes = await request('GET', '/api/admin/books');
  const listData = await listRes.json();
  // listData is array? or { success: true, data: [...] }? 
  // Scripts/test-modules-crud.ts treated it as success but didn't parse list.
  // Usually it returns array or { data: [] }.
  // Let's assume array or look at previous output.
  // Actually, I'll assume standard list.
  
  let books = [];
  if (Array.isArray(listData)) books = listData;
  else if (Array.isArray(listData.data)) books = listData.data;
  else if (Array.isArray(listData.books)) books = listData.books;
  
  const updatedBook = books.find(b => b._id === bookId || b.id === bookId);
  if (updatedBook) {
    console.log(`Current Stock: ${updatedBook.stock}`);
    if (updatedBook.stock === 8) {
      console.log('✅ Stock verification PASSED (10 - 2 = 8).');
    } else {
      console.error(`❌ Stock verification FAILED. Expected 8, got ${updatedBook.stock}`);
    }
  } else {
    console.error('❌ Could not find book to verify stock.');
  }

  // 4. Clean up
  await request('DELETE', `/api/admin/books?id=${bookId}`);
}

async function testRecruitmentWorkflow() {
  console.log('\n🤝 Testing Workflow 3: Recruitment Process');
  
  // 1. Create Form
  console.log('1. Creating Recruitment Form...');
  const newForm = {
    title: { en: 'Workflow Job', ta: 'வேலை' },
    description: { en: 'Desc', ta: 'விளக்கம்' },
    status: 'active', // Set status to 'active' instead of isActive: true
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
    fields: [
        { id: 'f1', type: 'text', label: { en: 'Name', ta: 'பெயர்' }, required: true, order: 1 }
    ]
  };
  
  const createRes = await request('POST', '/api/admin/recruitment-forms', newForm);
  if (createRes.status !== 201) {
    console.error('❌ Failed to create form');
    console.log(await createRes.text());
    return;
  }
  const formData = await createRes.json();
  console.error('DEBUG FORM DATA:', JSON.stringify(formData, null, 2));
  let formId = formData._id;
  if (!formId && formData.data) formId = formData.data._id;
  if (!formId && formData.form) formId = formData.form._id;
  if (!formId && formData.id) formId = formData.id;
  
  console.log(`✅ Form created. ID: ${formId}`);

  // 2. Submit Application (Public API)
  console.log('2. Submitting Application...');
  const appPayload = {
    formId: formId,
    answers: { f1: 'John Doe' },
    applicantName: 'John Doe',
    applicantEmail: 'john@example.com',
    roleApplied: 'participants'
  };
  
  // Public API, but we can send without auth?
  // POST /api/recruitment-responses doesn't check auth in the code I read.
  const submitRes = await request('POST', '/api/recruitment-responses', appPayload, false);
  if (submitRes.status !== 201) {
    console.error('❌ Failed to submit application');
    console.log(await submitRes.text());
  } else {
    console.log('✅ Application submitted.');
  }

  // 3. Verify Response in Admin
  console.log('3. Verifying Response in Admin Panel...');
  const responsesRes = await request('GET', `/api/admin/recruitment-responses?formId=${formId}`);
  if (responsesRes.status === 200) {
    const responsesData = await responsesRes.json();
    const responses = responsesData.data || responsesData.responses || [];
    if (responses.length > 0) {
       console.log(`✅ Found ${responses.length} response(s).`);
       if (responses[0].submitterName === 'John Doe') { // Note: API maps applicantName to submitterName
           console.log('✅ Applicant Name matches.');
       } else {
           console.error('❌ Applicant Name mismatch:', responses[0].submitterName);
       }
    } else {
       console.error('❌ No responses found for form.');
    }
  } else {
    console.error('❌ Failed to fetch responses.');
  }

  // 4. Clean up
  await request('DELETE', `/api/admin/recruitment-forms?id=${formId}`);
}

async function run() {
  try {
    await login();
    await testBookPurchaseWorkflow();
    await testRecruitmentWorkflow();
  } catch (e) {
    console.error('Workflow Test Failed:', e);
  }
}

run();
