// Test script to debug modal functionality
console.log('Testing modal functionality...');

// Wait for page to load
setTimeout(() => {
  console.log('=== Modal Debug Test ===');
  
  // Check if Create Component button exists
  const createBtn = document.querySelector('button[onclick*="setShowCreateModal"]') || 
                   document.querySelector('button:contains("Create Component")') ||
                   Array.from(document.querySelectorAll('button')).find(btn => 
                     btn.textContent.includes('Create Component'));
  
  console.log('Create Component button found:', !!createBtn);
  if (createBtn) {
    console.log('Button text:', createBtn.textContent);
    console.log('Button classes:', createBtn.className);
  }
  
  // Check if modal exists in DOM
  const modal = document.querySelector('.fixed.inset-0') || 
               document.querySelector('[class*="modal"]') ||
               document.querySelector('[class*="Modal"]');
  
  console.log('Modal element found:', !!modal);
  if (modal) {
    console.log('Modal classes:', modal.className);
    console.log('Modal display style:', window.getComputedStyle(modal).display);
  }
  
  // Check for any React errors in console
  const originalError = console.error;
  let reactErrors = [];
  console.error = function(...args) {
    if (args.some(arg => typeof arg === 'string' && 
        (arg.includes('React') || arg.includes('Objects are not valid as a React child')))) {
      reactErrors.push(args.join(' '));
    }
    originalError.apply(console, args);
  };
  
  // Try to click the create button if it exists
  if (createBtn) {
    console.log('Attempting to click Create Component button...');
    try {
      createBtn.click();
      
      // Check if modal appeared after click
      setTimeout(() => {
        const modalAfterClick = document.querySelector('.fixed.inset-0') || 
                               document.querySelector('[class*="modal"]');
        console.log('Modal visible after click:', !!modalAfterClick && 
                   window.getComputedStyle(modalAfterClick).display !== 'none');
        
        if (reactErrors.length > 0) {
          console.log('React errors detected:', reactErrors);
        } else {
          console.log('No React errors detected');
        }
        
        console.log('=== Modal Debug Test Complete ===');
      }, 500);
      
    } catch (error) {
      console.error('Error clicking button:', error);
    }
  }
  
}, 2000);