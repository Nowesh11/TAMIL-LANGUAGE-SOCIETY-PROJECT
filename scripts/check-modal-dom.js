// Debug script to check modal in DOM
// Copy and paste this into browser console

console.log('=== Modal Debug Script ===');

// Check if debug button exists
const debugButton = document.querySelector('button[style*="background-color: red"]');
console.log('Debug button found:', !!debugButton);

// Check if create button exists
const createButton = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.includes('Create Component')
);
console.log('Create Component button found:', !!createButton);

// Check for modal in DOM
const modal = document.querySelector('.fixed.inset-0');
console.log('Modal in DOM:', !!modal);

// Check for ComponentModal specifically
const componentModal = document.querySelector('[class*="fixed"][class*="inset-0"]');
console.log('Component modal in DOM:', !!componentModal);

// Try clicking debug button if it exists
if (debugButton) {
  console.log('Clicking debug button...');
  debugButton.click();
  
  // Check again after click
  setTimeout(() => {
    const modalAfterClick = document.querySelector('.fixed.inset-0');
    console.log('Modal after debug click:', !!modalAfterClick);
    
    if (modalAfterClick) {
      console.log('Modal element:', modalAfterClick);
      console.log('Modal styles:', window.getComputedStyle(modalAfterClick));
    }
  }, 100);
}

// Check React DevTools
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React DevTools available');
} else {
  console.log('React DevTools not available');
}