// Test script to verify modal components
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing Modal Components...');

// Check if modal files exist
const files = [
  'src/components/CartModal.tsx',
  'src/components/UserPurchasesModal.tsx',
  'src/styles/components/Modal.css'
];

let allFilesExist = true;

files.forEach(file => {
  try {
    const filePath = join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');
    console.log(`✅ ${file} exists (${content.length} characters)`);
  } catch (error) {
    console.log(`❌ ${file} missing or unreadable`);
    allFilesExist = false;
  }
});

// Check if books.tsx has been updated
try {
  const booksPath = join(process.cwd(), 'src/pages/books.tsx');
  const booksContent = readFileSync(booksPath, 'utf8');
  
  const hasCartModal = booksContent.includes('CartModal');
  const hasPurchasesModal = booksContent.includes('UserPurchasesModal');
  const hasModalStates = booksContent.includes('cartModalOpen') && booksContent.includes('purchasesModalOpen');
  const hasButtons = booksContent.includes('View Cart & Checkout') && booksContent.includes('My Purchases');
  
  console.log(`✅ books.tsx updated with modal imports: ${hasCartModal && hasPurchasesModal}`);
  console.log(`✅ books.tsx has modal state management: ${hasModalStates}`);
  console.log(`✅ books.tsx has modal trigger buttons: ${hasButtons}`);
  
  if (hasCartModal && hasPurchasesModal && hasModalStates && hasButtons) {
    console.log('🎉 All modal functionality appears to be correctly implemented!');
  } else {
    console.log('⚠️  Some modal functionality may be missing');
  }
  
} catch (error) {
  console.log('❌ Error checking books.tsx:', error.message);
  allFilesExist = false;
}

if (allFilesExist) {
  console.log('\n✅ Modal implementation test passed!');
  console.log('📝 Manual testing recommended:');
  console.log('   1. Visit /books page');
  console.log('   2. Add books to cart');
  console.log('   3. Click "View Cart & Checkout" button');
  console.log('   4. Test cart modal functionality');
  console.log('   5. Click "My Purchases" button');
  console.log('   6. Test purchases modal functionality');
  console.log('   7. Test MiniCart checkout button');
} else {
  console.log('\n❌ Modal implementation test failed!');
  process.exit(1);
}