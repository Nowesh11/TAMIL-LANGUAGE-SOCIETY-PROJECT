
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin_test_999@example.com';
const ADMIN_PASSWORD = 'password123';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

const PAGES = [
  { path: '/admin/dashboard', name: '01-dashboard' },
  { path: '/admin/books', name: '02-books', hasModal: true, buttonSelector: 'button:has-text("Add New Book")' }, // Heuristic selector, might need adjustment
  { path: '/admin/ebooks', name: '03-ebooks' },
  { path: '/admin/components', name: '04-components' },
  { path: '/admin/posters', name: '05-posters' },
  { path: '/admin/team', name: '06-team' },
  { path: '/admin/project-items', name: '07-project-items' },
  { path: '/admin/recruitment', name: '08-recruitment' },
  { path: '/admin/files', name: '09-files' },
  { path: '/admin/chat', name: '10-chat' },
  { path: '/admin/notifications', name: '11-notifications' },
  { path: '/admin/payment-settings', name: '12-payment-settings' }
];

async function runAudit() {
  console.log('🚀 Starting Visual Audit & Manual Simulation...');
  
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR);
  }

  const browser = await puppeteer.launch({
    headless: true, // Set to false if you want to watch it happen
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleLogs: string[] = [];
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });

  page.on('pageerror', err => {
    consoleLogs.push(`[PAGE ERROR] ${err.message}`);
  });

  try {
    // 1. Login
     console.log('🔑 Logging in...');
      const loginUrl = `${BASE_URL}/admin/login`;
      // Increase timeout for first load compilation
      const response = await page.goto(loginUrl, { waitUntil: 'networkidle0', timeout: 90000 });
      
      if (response && response.status() === 404) {
          throw new Error(`Login page returned 404 at ${loginUrl}`);
      }
      
      const pageTitle = await page.title();
      console.log(`   Page Title: ${pageTitle}`);
  
      try {
          console.log('   ⏳ Waiting for selector #email...');
          await page.waitForSelector('#email', { timeout: 60000, visible: true });
          console.log('   found selector #email');
          
          await page.type('#email', ADMIN_EMAIL);
          await page.type('#password', ADMIN_PASSWORD);
          
          console.log('   Clicking submit...');
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
            page.click('button[type="submit"]')
          ]);
          console.log('✅ Login successful.');
      } catch (e) {
         await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-fail.png') });
         const html = await page.content();
         fs.writeFileSync(path.join(SCREENSHOT_DIR, 'login-fail.html'), html);
         throw new Error(`Login failed: ${e.message}. Screenshot saved to login-fail.png. HTML saved to login-fail.html`);
     }

    // 2. Visit Pages & Take Screenshots
    for (const p of PAGES) {
      console.log(`📸 Auditing ${p.name}...`);
      try {
          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle0', timeout: 90000 });
          
          // Desktop Screenshot
          await page.setViewport({ width: 1920, height: 1080 });
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}-desktop.png`), fullPage: true });
          
          // Mobile Screenshot
          await page.setViewport({ width: 375, height: 667, isMobile: true });
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}-mobile.png`), fullPage: true });
    
          // If page has a modal/form interaction (Simulating "Click through" and "Fill form")
          if (p.name === '02-books') {
             console.log('   ✍️  Simulating Form Interaction on Books page...');
             // Reset to desktop for interaction
             await page.setViewport({ width: 1920, height: 1080 });
             
             // Find button via evaluate (most robust)
              const foundButton = await page.evaluate(() => {
                  const buttons = Array.from(document.querySelectorAll('button'));
                  // Look for "Add Book" specifically
                  const target = buttons.find(b => b.textContent?.includes('Add Book'));
                  if (target) {
                      target.click();
                      return true;
                  }
                  return false;
              });

             if (foundButton) {
                // Wait for modal to appear
                await new Promise(r => setTimeout(r, 2000)); 
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}-modal-desktop.png`) });
                console.log('   ✅ Modal opened and captured.');
                
                // Try to fill title if it exists
                const titleInput = await page.$('input[name="title.en"]');
                if (titleInput) {
                    await titleInput.type('Automated Test Book');
                    console.log('   ✅ Form filled (Title).');
                }
                
                // Close modal to proceed safely (ESC)
                await page.keyboard.press('Escape');
                await new Promise(r => setTimeout(r, 1000));
             } else {
                console.log('   ⚠️ Could not find "Add New Book" button.');
             }
          }

          if (p.name === '10-chat') {
             console.log('   💬 Verifying Chat UI...');
             // Wait a bit for chat to load
             await new Promise(r => setTimeout(r, 2000));
             
             const isChatLoaded = await page.evaluate(() => {
                 const sidebar = document.querySelector('.border-r.border-gray-200');
                 const title = Array.from(document.querySelectorAll('h1')).find(h => h.textContent?.includes('WhatsApp Web Clone'));
                 return !!(sidebar && title);
             });
             
             if (isChatLoaded) {
                 console.log('   ✅ Chat UI loaded correctly (Sidebar & Placeholder detected).');
             } else {
                 console.error('   ❌ Chat UI missing key elements.');
             }
          }
      } catch (err) {
          console.error(`   ❌ Failed to audit ${p.name}:`, err.message);
          // Take error screenshot
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}-error.png`) });
      }
    }

  } catch (error) {
    console.error('❌ Audit Failed:', error);
  } finally {
    await browser.close();
  }

  // Report Findings
  console.log('\n📊 Audit Report:');
  console.log('----------------------------------------');
  if (consoleLogs.length > 0) {
    console.log('⚠️ Console Errors/Warnings Found:');
    consoleLogs.forEach(log => console.log(log));
  } else {
    console.log('✅ No Console Errors/Warnings captured.');
  }
  console.log('----------------------------------------');
  console.log(`🖼️  Screenshots saved to: ${SCREENSHOT_DIR}`);
}

runAudit();
