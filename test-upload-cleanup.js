const fs = require('fs');
const path = require('path');

// Test script to verify upload directory structure and cleanup functionality
console.log('🧪 Testing Upload Directory Structure and Cleanup System\n');

const uploadsDir = path.join(__dirname, 'uploads');

// Function to check directory structure
function checkDirectoryStructure() {
  console.log('📁 Current Upload Directory Structure:');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ Uploads directory does not exist');
    return;
  }
  
  const categories = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  categories.forEach(category => {
    const categoryPath = path.join(uploadsDir, category);
    console.log(`\n📂 ${category}/`);
    
    try {
      const items = fs.readdirSync(categoryPath, { withFileTypes: true });
      
      items.forEach(item => {
        if (item.isDirectory()) {
          const itemPath = path.join(categoryPath, item.name);
          const subItems = fs.readdirSync(itemPath);
          console.log(`  📁 ${item.name}/ (${subItems.length} files)`);
          subItems.forEach(subItem => {
            console.log(`    📄 ${subItem}`);
          });
        } else {
          console.log(`  📄 ${item.name}`);
        }
      });
    } catch (error) {
      console.log(`  ❌ Error reading directory: ${error.message}`);
    }
  });
}

// Function to verify expected structure
function verifyStructure() {
  console.log('\n✅ Verifying Expected Structure:');
  
  const expectedStructures = [
    { path: 'team', description: 'Team images should be in uploads/team/{memberId}/photo' },
    { path: 'posters', description: 'Poster images should be in uploads/posters/{posterId}/image' },
    { path: 'components', description: 'Component images should be in uploads/components/{componentType}/{componentId}/ or uploads/components/ for logos' }
  ];
  
  expectedStructures.forEach(({ path: categoryPath, description }) => {
    const fullPath = path.join(uploadsDir, categoryPath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${categoryPath}/ exists - ${description}`);
      
      // Check if it follows ID-based structure
      const items = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());
      
      if (items.length > 0) {
        const hasIdStructure = items.some(item => 
          item.name.length >= 20 && /^[a-f0-9]+$/i.test(item.name)
        );
        
        if (hasIdStructure) {
          console.log(`  ✅ Uses ID-based directory structure`);
        } else {
          console.log(`  ℹ️  Contains non-ID directories (may include logos)`);
        }
      }
    } else {
      console.log(`⚠️  ${categoryPath}/ does not exist yet`);
    }
  });
}

// Function to count files by category
function countFiles() {
  console.log('\n📊 File Count Summary:');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ Uploads directory does not exist');
    return;
  }
  
  const categories = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let totalFiles = 0;
  
  categories.forEach(category => {
    const categoryPath = path.join(uploadsDir, category);
    let categoryFiles = 0;
    
    try {
      function countFilesRecursive(dirPath) {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        let count = 0;
        
        items.forEach(item => {
          if (item.isDirectory()) {
            count += countFilesRecursive(path.join(dirPath, item.name));
          } else {
            count++;
          }
        });
        
        return count;
      }
      
      categoryFiles = countFilesRecursive(categoryPath);
      totalFiles += categoryFiles;
      
      console.log(`📂 ${category}: ${categoryFiles} files`);
    } catch (error) {
      console.log(`❌ Error counting files in ${category}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 Total files: ${totalFiles}`);
}

// Run all tests
console.log('Starting tests...\n');
checkDirectoryStructure();
verifyStructure();
countFiles();

console.log('\n🎉 Upload directory structure test completed!');
console.log('\n💡 To test cleanup functionality:');
console.log('1. Delete a team member, poster, or component from the admin panel');
console.log('2. Check that the corresponding upload directory is automatically removed');
console.log('3. Verify that the database record is deleted but files are cleaned up');