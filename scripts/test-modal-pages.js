const puppeteer = require('puppeteer');

async function testComponentModalPages() {
  console.log('🚀 Starting Component Modal Pages Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to admin components page
    console.log('📍 Navigating to admin components page...');
    await page.goto('http://localhost:3000/admin/components', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test Create Component Modal
    console.log('🔍 Testing Create Component Modal...');
    
    // Click Create Component button
    const createButton = await page.waitForSelector('button:has-text("Create Component"), .admin-btn:has-text("Create"), [data-testid="create-component"]', { timeout: 5000 });
    if (createButton) {
      await createButton.click();
      console.log('✅ Create Component button clicked');
    } else {
      // Try alternative selectors
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && text.toLowerCase().includes('create')) {
          await button.click();
          console.log('✅ Create button found and clicked');
          break;
        }
      }
    }
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check if modal is visible
    const modal = await page.$('.modern-modal, .modal, [role="dialog"]');
    if (modal) {
      console.log('✅ Create modal opened successfully');
      
      // Test page dropdown options
      console.log('🔍 Testing page dropdown options...');
      const pageSelect = await page.$('select[value=""], select:has(option[value="home"])');
      if (pageSelect) {
        const options = await page.evaluate(select => {
          return Array.from(select.options).map(option => ({
            value: option.value,
            text: option.textContent
          }));
        }, pageSelect);
        
        console.log('📋 Available page options:', options);
        
        // Check if we have the 9 main pages
        const expectedPages = ['home', 'about', 'projects', 'ebooks', 'books', 'contacts', 'notifications', 'login', 'signup'];
        const availablePages = options.filter(opt => opt.value !== '').map(opt => opt.value);
        
        const hasAllPages = expectedPages.every(page => availablePages.includes(page));
        const hasOnlyExpectedPages = availablePages.every(page => expectedPages.includes(page));
        
        if (hasAllPages && hasOnlyExpectedPages) {
          console.log('✅ Page dropdown contains exactly the 9 main pages');
        } else {
          console.log('❌ Page dropdown issues:');
          console.log('  Missing pages:', expectedPages.filter(page => !availablePages.includes(page)));
          console.log('  Extra pages:', availablePages.filter(page => !expectedPages.includes(page)));
        }
      } else {
        console.log('❌ Page select dropdown not found');
      }
      
      // Close modal
      const closeButton = await page.$('.modern-close-button, .close-button, button:has-text("Cancel")');
      if (closeButton) {
        await closeButton.click();
        console.log('✅ Modal closed successfully');
      }
    } else {
      console.log('❌ Create modal did not open');
    }
    
    // Wait a moment before testing edit modal
    await page.waitForTimeout(1000);
    
    // Test Edit Component Modal
    console.log('🔍 Testing Edit Component Modal...');
    
    // Look for edit buttons in the component list
    const editButtons = await page.$$('button:has-text("Edit"), .edit-btn, [data-action="edit"]');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      console.log('✅ Edit button clicked');
      
      // Wait for modal to appear
      await page.waitForTimeout(1000);
      
      // Check if edit modal is visible
      const editModal = await page.$('.modern-modal, .modal, [role="dialog"]');
      if (editModal) {
        console.log('✅ Edit modal opened successfully');
        
        // Test page dropdown in edit modal
        const editPageSelect = await page.$('select[value=""], select:has(option[value="home"])');
        if (editPageSelect) {
          const editOptions = await page.evaluate(select => {
            return Array.from(select.options).map(option => ({
              value: option.value,
              text: option.textContent
            }));
          }, editPageSelect);
          
          console.log('📋 Edit modal page options:', editOptions);
          
          // Check if edit modal also has the 9 main pages
          const expectedPages = ['home', 'about', 'projects', 'ebooks', 'books', 'contacts', 'notifications', 'login', 'signup'];
          const availablePages = editOptions.filter(opt => opt.value !== '').map(opt => opt.value);
          
          const hasAllPages = expectedPages.every(page => availablePages.includes(page));
          const hasOnlyExpectedPages = availablePages.every(page => expectedPages.includes(page));
          
          if (hasAllPages && hasOnlyExpectedPages) {
            console.log('✅ Edit modal page dropdown contains exactly the 9 main pages');
          } else {
            console.log('❌ Edit modal page dropdown issues:');
            console.log('  Missing pages:', expectedPages.filter(page => !availablePages.includes(page)));
            console.log('  Extra pages:', availablePages.filter(page => !expectedPages.includes(page)));
          }
        }
        
        // Close edit modal
        const editCloseButton = await page.$('.modern-close-button, .close-button, button:has-text("Cancel")');
        if (editCloseButton) {
          await editCloseButton.click();
          console.log('✅ Edit modal closed successfully');
        }
      } else {
        console.log('❌ Edit modal did not open');
      }
    } else {
      console.log('⚠️ No edit buttons found (this might be normal if no components exist)');
    }
    
    console.log('🎉 Component Modal Pages Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testComponentModalPages().catch(console.error);