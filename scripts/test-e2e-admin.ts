import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@tamilsociety.org';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

type CheckResult = { name: string; ok: boolean; status?: number; detail?: any };

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let body: any = null;
  const ct = res.headers.get('content-type') || '';
  try {
    body = ct.includes('application/json') ? await res.json() : await res.text();
  } catch {}
  return { res, body };
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
  assert(res.ok, `Login failed (${res.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  const token = (body && (body.accessToken || body.token)) as string;
  assert(token && token.length > 10, 'No access token returned from login');
  return token;
}

async function checkPublicComponentsPage(): Promise<CheckResult> {
  const { res, body } = await fetchJSON(`${baseUrl}/api/components/page?page=home`);
  return { name: 'Public Components Page', ok: res.ok, status: res.status, detail: body };
}

async function checkAdminDashboard(token: string): Promise<CheckResult> {
  const { res, body } = await fetchJSON(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { name: 'Admin Dashboard', ok: res.ok, status: res.status, detail: body };
}

async function checkAdminComponents(token: string): Promise<CheckResult> {
  const { res, body } = await fetchJSON(`${baseUrl}/api/admin/components?limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { name: 'Admin Components', ok: res.ok, status: res.status, detail: body };
}

async function checkAdminPosters(token: string): Promise<CheckResult> {
  const { res, body } = await fetchJSON(`${baseUrl}/api/admin/posters?limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { name: 'Admin Posters', ok: res.ok, status: res.status, detail: body };
}

async function checkAdminTeam(token: string): Promise<CheckResult> {
  const { res, body } = await fetchJSON(`${baseUrl}/api/admin/team?limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { name: 'Admin Team', ok: res.ok, status: res.status, detail: body };
}

async function checkImage(url: string): Promise<CheckResult> {
  const res = await fetch(url);
  return { name: `Image ${url}`, ok: res.ok || res.status === 304, status: res.status };
}

function printResult(r: CheckResult) {
  const statusText = r.ok ? 'OK' : 'FAIL';
  console.log(`[${statusText}] ${r.name} (${r.status ?? 'no-status'})`);
}

async function main() {
  console.log(`Base URL: ${baseUrl}`);
  console.log('Starting E2E admin test...');

  // 1) Login
  const token = await login();
  console.log('Login succeeded. Token acquired.');

  // 2) Public API smoke
  const publicRes = await checkPublicComponentsPage();
  printResult(publicRes);
  assert(publicRes.ok, 'Public components page failed');

  // 3) Admin dashboard
  const dashRes = await checkAdminDashboard(token);
  printResult(dashRes);
  assert(dashRes.ok, 'Admin dashboard failed');

  // 4) Admin components
  const compsRes = await checkAdminComponents(token);
  printResult(compsRes);
  assert(compsRes.ok, 'Admin components failed');

  // 5) Admin posters
  const postersRes = await checkAdminPosters(token);
  printResult(postersRes);
  assert(postersRes.ok, 'Admin posters failed');

  // 6) Admin team
  const teamRes = await checkAdminTeam(token);
  printResult(teamRes);
  assert(teamRes.ok, 'Admin team failed');

  // 7) Image checks (best effort, warnings only)
  const imageChecks: Promise<CheckResult>[] = [];
  const posters = (postersRes.detail && postersRes.detail.data) || [];
  const team = (teamRes.detail && teamRes.detail.data) || [];

  posters.slice(0, 3).forEach((p: any) => {
    if (p?.imageUrl) imageChecks.push(checkImage(`${baseUrl}${p.imageUrl}`));
  });
  team.slice(0, 3).forEach((m: any) => {
    if (m?.imageUrl) imageChecks.push(checkImage(`${baseUrl}${m.imageUrl}`));
  });

  const imgResults = await Promise.all(imageChecks);
  imgResults.forEach((r) => printResult(r));
  const imgFailures = imgResults.filter((r) => !r.ok);
  if (imgFailures.length) {
    console.warn(`Image warnings: ${imgFailures.length} images returned non-200/304.`);
  }

  console.log('E2E admin tests completed successfully.');
}

main().catch((err) => {
  console.error('E2E admin tests failed:', err?.message || err);
  process.exit(1);
});