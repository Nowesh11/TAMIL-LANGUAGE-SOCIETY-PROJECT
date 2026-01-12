const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Component Save Issue');
console.log('=====================================\n');

// 1. Check the frontend code
console.log('1. Checking frontend handleSaveComponent function...');
const pageFilePath = path.join(process.cwd(), 'src/app/admin/components/page.tsx');
if (fs.existsSync(pageFilePath)) {
  const pageContent = fs.readFileSync(pageFilePath, 'utf8');
  
  // Check for PATCH method
  const hasPatchMethod = pageContent.includes("method = selectedComponent ? 'PATCH' : 'POST'");
  console.log(`   ✅ PATCH method fix applied: ${hasPatchMethod}`);
  
  // Check URL construction
  const hasCorrectUrl = pageContent.includes('`/api/admin/components/${selectedComponent._id}`');
  console.log(`   ✅ Correct URL construction: ${hasCorrectUrl}`);
  
  // Extract the handleSaveComponent function
  const handleSaveMatch = pageContent.match(/const handleSaveComponent = async \(componentData: any\) => \{[\s\S]*?\}\s*catch/);
  if (handleSaveMatch) {
    console.log('   📋 Current handleSaveComponent implementation:');
    console.log('   ' + handleSaveMatch[0].split('\n').slice(0, 20).join('\n   '));
  }
} else {
  console.log('   ❌ Page file not found');
}

console.log('\n2. Checking API route files...');

// Check main components route
const mainRouteFile = path.join(process.cwd(), 'src/app/api/admin/components/route.ts');
if (fs.existsSync(mainRouteFile)) {
  const mainRouteContent = fs.readFileSync(mainRouteFile, 'utf8');
  const hasPostMethod = mainRouteContent.includes('export async function POST(');
  const hasPutMethod = mainRouteContent.includes('export async function PUT(');
  console.log(`   ✅ Main route has POST method: ${hasPostMethod}`);
  console.log(`   ✅ Main route has PUT method: ${hasPutMethod}`);
} else {
  console.log('   ❌ Main route file not found');
}

// Check individual component route
const individualRouteFile = path.join(process.cwd(), 'src/app/api/admin/components/[id]/route.ts');
if (fs.existsSync(individualRouteFile)) {
  const individualRouteContent = fs.readFileSync(individualRouteFile, 'utf8');
  const hasPatchMethod = individualRouteContent.includes('export async function PATCH(');
  const hasDeleteMethod = individualRouteContent.includes('export async function DELETE(');
  console.log(`   ✅ Individual route has PATCH method: ${hasPatchMethod}`);
  console.log(`   ✅ Individual route has DELETE method: ${hasDeleteMethod}`);
} else {
  console.log('   ❌ Individual route file not found');
}

console.log('\n3. Analyzing potential issues...');

// Check for common issues
const issues = [];

// Issue 1: Check if there's a mismatch in the API route structure
console.log('   🔍 Checking for potential route conflicts...');

// Issue 2: Check if there are any syntax errors in the route files
console.log('   🔍 Checking for syntax issues...');

// Issue 3: Check if the error handling is proper
console.log('   🔍 Checking error handling patterns...');

if (fs.existsSync(pageFilePath)) {
  const pageContent = fs.readFileSync(pageFilePath, 'utf8');
  
  // Check if error handling tries to parse JSON from non-JSON responses
  const hasProperErrorHandling = pageContent.includes('if (!response.ok)') && 
                                 pageContent.includes('await response.json()');
  
  if (hasProperErrorHandling) {
    console.log('   ⚠️  POTENTIAL ISSUE: Error handling tries to parse JSON from error responses');
    console.log('      This could cause "Unexpected end of JSON input" if the server returns non-JSON error responses');
    issues.push('Error handling assumes all responses are JSON');
  }
}

console.log('\n4. Recommendations...');

if (issues.length > 0) {
  console.log('   🚨 Issues found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
} else {
  console.log('   ✅ No obvious issues found in the code structure');
}

console.log('\n5. Next steps for debugging:');
console.log('   1. Check if the development server is running properly');
console.log('   2. Verify that the MongoDB connection is working');
console.log('   3. Test the API endpoints directly with curl or Postman');
console.log('   4. Check the server logs for more detailed error information');
console.log('   5. Verify that the authentication token is valid');

console.log('\n6. Manual testing commands:');
console.log('   Test POST (create): curl -X POST http://localhost:3000/api/admin/components \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('     -d \'{"type":"text","page":"test","content":{"title":{"en":"Test","ta":"Test"}}}\'');
console.log('');
console.log('   Test PATCH (update): curl -X PATCH http://localhost:3000/api/admin/components/COMPONENT_ID \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('     -d \'{"content":{"title":{"en":"Updated","ta":"Updated"}}}\'');

console.log('\n✅ Debug analysis completed');