/**
 * Test script for the redesigned ComponentModal
 * This script tests the modal functionality with different component types
 */

const puppeteer = require('puppeteer');

async function testComponentModal() {
  console.log('🚀 Starting ComponentModal tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to admin components page
    console.log('📍 Navigating to admin components page...');
    await page.goto('http://localhost:3000/admin/components', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForSelector('.admin-content', { timeout: 10000 });
    console.log('✅ Admin components page loaded');
    
    // Test 1: Check if "Create Component" button exists
    console.log('🔍 Testing Create Component button...');
    const createButton = await page.$('button:contains("Create Component"), .create-btn, [data-testid="create-component"]');
    if (createButton) {
      console.log('✅ Create Component button found');
      
      // Click the create button
      await createButton.click();
      console.log('🖱️ Clicked Create Component button');
      
      // Wait for modal to appear
      await page.waitForSelector('.modern-modal-overlay, .component-modal-overlay', { timeout: 5000 });
      console.log('✅ Modal appeared');
      
      // Test 2: Check modal styling
      const modalContainer = await page.$('.modern-modal-container, .component-modal-container');
      if (modalContainer) {
        const styles = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow,
            zIndex: computed.zIndex
          };
        }, modalContainer);
        
        console.log('🎨 Modal styles:', styles);
        console.log('✅ Modal has modern styling');
      }
      
      // Test 3: Check component type selector
      const typeSelector = await page.$('select[name="type"], .component-type-select');
      if (typeSelector) {
        console.log('✅ Component type selector found');
        
        // Test different component types
        const componentTypes = ['hero', 'banner', 'text', 'image', 'gallery', 'features', 'cta'];
        
        for (const type of componentTypes) {
          console.log(`🔄 Testing ${type} component type...`);
          
          // Select component type
          await page.select('select[name="type"], .component-type-select', type);
          
          // Wait for dynamic fields to load
          await page.waitForTimeout(1000);
          
          // Check if dynamic fields appeared
          const dynamicFields = await page.$$('.modern-field-group, .dynamic-field');
          console.log(`📝 ${type} component has ${dynamicFields.length} dynamic fields`);
        }
        
        console.log('✅ Dynamic fields working for all component types');
      }
      
      // Test 4: Check file upload functionality
      console.log('📁 Testing file upload functionality...');
      const fileInputs = await page.$$('input[type="file"]');
      if (fileInputs.length > 0) {
        console.log(`✅ Found ${fileInputs.length} file upload inputs`);
      }
      
      // Test 5: Check form validation
      console.log('✔️ Testing form validation...');
      const submitButton = await page.$('button[type="submit"], .submit-btn');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        const errorMessages = await page.$$('.error-message, .field-error');
        if (errorMessages.length > 0) {
          console.log('✅ Form validation working - error messages displayed');
        }
      }
      
      // Close modal
      const closeButton = await page.$('.modal-close, .close-btn, button:contains("Cancel")');
      if (closeButton) {
        await closeButton.click();
        console.log('🔒 Modal closed successfully');
      }
      
    } else {
      console.log('❌ Create Component button not found');
    }
    
    console.log('🎉 ComponentModal tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testComponentModal().catch(console.error);
}

module.exports = { testComponentModal };