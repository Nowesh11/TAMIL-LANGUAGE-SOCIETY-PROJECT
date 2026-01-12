import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@tamilsociety.org';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

type CheckResult = { name: string; ok: boolean; status?: number; detail?: any; duration?: number };

async function fetchJSON(url: string, init?: RequestInit) {
  const start = Date.now();
  const res = await fetch(url, init);
  const duration = Date.now() - start;
  let body: any = null;
  const ct = res.headers.get('content-type') || '';
  try {
    body = ct.includes('application/json') ? await res.json() : await res.text();
  } catch {}
  return { res, body, duration };
}

function assert(condition: any, message: string) {
  if (!condition) throw new Error(message);
}

async function login(): Promise<string> {
  const { res, body } = await fetchJSON(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  const token = (body && (body.accessToken || body.token)) as string;
  if (!token || token.length < 10) throw new Error('No access token returned from login');
  return token;
}

async function checkEndpoint(token: string, name: string, path: string): Promise<CheckResult> {
  const { res, body, duration } = await fetchJSON(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { name, ok: res.ok, status: res.status, detail: body, duration };
}

function printResult(r: CheckResult) {
  const statusText = r.ok ? 'PASS' : 'FAIL';
  const timeText = r.duration ? `${r.duration}ms` : '';
  console.log(`[${statusText}] ${r.name} (${r.status}) - ${timeText}`);
  if (!r.ok) {
    console.error(`   Error: ${JSON.stringify(r.detail)}`);
  }
}

async function main() {
  console.log('================================================================');
  console.log('       TAMIL LANGUAGE SOCIETY ADMIN PANEL - COMPREHENSIVE TEST       ');
  console.log('================================================================');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('----------------------------------------------------------------');

  try {
    // 1. Authentication
    console.log('\n>>> Phase 1: Authentication');
    const token = await login();
    console.log('[PASS] Login successful');

    // 2. Module Verification (Read Operations)
    console.log('\n>>> Phase 2: Module API Availability & Performance');
    
    const modules = [
      { name: 'Dashboard Stats', path: '/api/admin/dashboard' }, // Using dashboard route as stats proxy
      { name: 'Components', path: '/api/admin/components?limit=1' },
      { name: 'Posters', path: '/api/admin/posters?limit=1' },
      { name: 'Team', path: '/api/admin/team?limit=1' },
      { name: 'Books', path: '/api/admin/books?limit=1' },
      { name: 'E-Books', path: '/api/admin/ebooks?limit=1' },
      { name: 'Project Items', path: '/api/admin/project-items?limit=1' },
      { name: 'Recruitment', path: '/api/admin/recruitment-forms?limit=1' },
      { name: 'Recruitment Responses', path: '/api/admin/recruitment-responses?limit=1' },
      { name: 'File Records', path: '/api/admin/files' },
      { name: 'Chat Conversations', path: '/api/admin/chat/conversations' },
      { name: 'Notifications', path: '/api/notifications?limit=1' },
      { name: 'Payment Settings', path: '/api/admin/payment-settings' }
    ];

    const results = [];
    for (const mod of modules) {
      const result = await checkEndpoint(token, mod.name, mod.path);
      printResult(result);
      results.push(result);
      // Small delay to prevent rate limiting issues during test
      await new Promise(r => setTimeout(r, 100)); 
    }

    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      console.error(`\n[!] ${failed.length} modules failed availability check.`);
    } else {
      console.log('\n[SUCCESS] All 12 Modules are responding correctly.');
    }

    // 3. Performance Check
    console.log('\n>>> Phase 3: API Performance Check (<500ms target)');
    const slowApis = results.filter(r => (r.duration || 0) > 500);
    if (slowApis.length > 0) {
      console.warn(`[WARN] The following APIs exceeded 500ms:`);
      slowApis.forEach(r => console.warn(`   - ${r.name}: ${r.duration}ms`));
    } else {
      console.log('[PASS] All APIs responded within 500ms.');
    }

    // 4. File System Check (File Records)
    console.log('\n>>> Phase 4: File System Integrity');
    const fileRes = results.find(r => r.name === 'File Records');
    if (fileRes && fileRes.ok && fileRes.detail.files) {
      console.log(`[INFO] System currently hosts ${fileRes.detail.files.length} files.`);
    }

    console.log('\n----------------------------------------------------------------');
    console.log('Test Complete.');
    console.log('================================================================');

  } catch (error: any) {
    console.error('\n[FATAL] Test aborted due to critical error:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();