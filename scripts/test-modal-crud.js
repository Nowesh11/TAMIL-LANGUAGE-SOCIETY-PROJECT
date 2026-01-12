const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let accessToken = '';

// Test data
const testComponent = {
  type: 'text',
  page: 'home',
  bureau: 'education',
  content: {
    title: { en: 'Test Component', ta: 'சோதனை கூறு' },
    description: { en: 'Test Description', ta: 'சோதனை விளக்கம்' }
  },
  order: 1,
  isActive: true
};

const testTeamMember = {
  name: { en: 'Test Member', ta: 'சோதனை உறுப்பினர்' },
  role: 'developer',
  department: 'technology',
  bio: { en: 'Test Bio', ta: 'சோதனை வாழ்க்கை வரலாறு' },
  email: 'test@example.com',
  isActive: true,
  orderNum: 1
};

const testPoster = {
  title: { en: 'Test Poster', ta: 'சோதனை சுவரொட்டி' },
  description: { en: 'Test Description', ta: 'சோதனை விளக்கம்' },
  category: 'event',
  isActive: true,
  isFeatured: false,
  order: 1
};

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });
  
  const data = await response.json();
  return { response, data };
}

// Test admin login
async function testLogin() {
  console.log('🔐 Testing admin login...');
  
  const { response, data } = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@tamilsociety.org',
      password: 'admin123'
    })
  });
  
  if (response.ok && data.accessToken) {
    accessToken = data.accessToken;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', data.error);
    return false;
  }
}

// Test component CRUD operations
async function testComponentCRUD() {
  console.log('\n📦 Testing Component CRUD operations...');
  
  // Create component
  console.log('Creating component...');
  const { response: createResponse, data: createData } = await makeRequest('/api/admin/components', {
    method: 'POST',
    body: JSON.stringify(testComponent)
  });
  
  if (createResponse.ok && createData.success) {
    console.log('✅ Component created successfully');
    const componentId = createData.component._id;
    
    // Read component
    console.log('Reading component...');
    const { response: readResponse, data: readData } = await makeRequest(`/api/admin/components/${componentId}`);
    
    if (readResponse.ok && readData.success) {
      console.log('✅ Component read successfully');
      
      // Update component
      console.log('Updating component...');
      const updatedComponent = {
        ...testComponent,
        content: {
          title: { en: 'Updated Test Component', ta: 'புதுப்பிக்கப்பட்ட சோதனை கூறு' },
          description: { en: 'Updated Description', ta: 'புதுப்பிக்கப்பட்ட விளக்கம்' }
        }
      };
      
      const { response: updateResponse, data: updateData } = await makeRequest(`/api/admin/components/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedComponent)
      });
      
      if (updateResponse.ok && updateData.success) {
        console.log('✅ Component updated successfully');
        
        // Delete component
        console.log('Deleting component...');
        const { response: deleteResponse, data: deleteData } = await makeRequest(`/api/admin/components/${componentId}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok && deleteData.success) {
          console.log('✅ Component deleted successfully');
          return true;
        } else {
          console.log('❌ Component deletion failed:', deleteData.error);
        }
      } else {
        console.log('❌ Component update failed:', updateData.error);
      }
    } else {
      console.log('❌ Component read failed:', readData.error);
    }
  } else {
    console.log('❌ Component creation failed:', createData.error);
  }
  
  return false;
}

// Test team member CRUD operations
async function testTeamCRUD() {
  console.log('\n👥 Testing Team Member CRUD operations...');
  
  // Create team member
  console.log('Creating team member...');
  const { response: createResponse, data: createData } = await makeRequest('/api/admin/team', {
    method: 'POST',
    body: JSON.stringify(testTeamMember)
  });
  
  if (createResponse.ok && createData.success) {
    console.log('✅ Team member created successfully');
    const memberId = createData.member._id;
    
    // Read team member
    console.log('Reading team member...');
    const { response: readResponse, data: readData } = await makeRequest(`/api/admin/team/${memberId}`);
    
    if (readResponse.ok && readData.success) {
      console.log('✅ Team member read successfully');
      
      // Update team member
      console.log('Updating team member...');
      const updatedMember = {
        _id: memberId,
        ...testTeamMember,
        name: { en: 'Updated Test Member', ta: 'புதுப்பிக்கப்பட்ட சோதனை உறுப்பினர்' }
      };
      
      const { response: updateResponse, data: updateData } = await makeRequest('/api/admin/team', {
        method: 'PUT',
        body: JSON.stringify(updatedMember)
      });
      
      if (updateResponse.ok && updateData.success) {
        console.log('✅ Team member updated successfully');
        
        // Delete team member
        console.log('Deleting team member...');
        const { response: deleteResponse, data: deleteData } = await makeRequest(`/api/admin/team?id=${memberId}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok && deleteData.success) {
          console.log('✅ Team member deleted successfully');
          return true;
        } else {
          console.log('❌ Team member deletion failed:', deleteData.error);
        }
      } else {
        console.log('❌ Team member update failed:', updateData.error);
      }
    } else {
      console.log('❌ Team member read failed:', readData.error);
    }
  } else {
    console.log('❌ Team member creation failed:', createData.error);
  }
  
  return false;
}

// Test poster CRUD operations
async function testPosterCRUD() {
  console.log('\n🖼️ Testing Poster CRUD operations...');
  
  // Create poster
  console.log('Creating poster...');
  const { response: createResponse, data: createData } = await makeRequest('/api/admin/posters', {
    method: 'POST',
    body: JSON.stringify(testPoster)
  });
  
  if (createResponse.ok && createData.success) {
    console.log('✅ Poster created successfully');
    const posterId = createData.poster._id;
    
    // Read poster
    console.log('Reading poster...');
    const { response: readResponse, data: readData } = await makeRequest(`/api/admin/posters/${posterId}`);
    
    if (readResponse.ok && readData.success) {
      console.log('✅ Poster read successfully');
      
      // Update poster
      console.log('Updating poster...');
      const updatedPoster = {
        _id: posterId,
        ...testPoster,
        title: { en: 'Updated Test Poster', ta: 'புதுப்பிக்கப்பட்ட சோதனை சுவரொட்டி' }
      };
      
      const { response: updateResponse, data: updateData } = await makeRequest('/api/admin/posters', {
        method: 'PUT',
        body: JSON.stringify(updatedPoster)
      });
      
      if (updateResponse.ok && updateData.success) {
        console.log('✅ Poster updated successfully');
        
        // Delete poster
        console.log('Deleting poster...');
        const { response: deleteResponse, data: deleteData } = await makeRequest('/api/admin/posters', {
          method: 'DELETE',
          body: JSON.stringify({ id: posterId })
        });
        
        if (deleteResponse.ok && deleteData.success) {
          console.log('✅ Poster deleted successfully');
          return true;
        } else {
          console.log('❌ Poster deletion failed:', deleteData.error);
        }
      } else {
        console.log('❌ Poster update failed:', updateData.error);
      }
    } else {
      console.log('❌ Poster read failed:', readData.error);
    }
  } else {
    console.log('❌ Poster creation failed:', createData.error);
  }
  
  return false;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Modal CRUD Operations Test\n');
  
  // Test login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without valid authentication');
    return;
  }
  
  // Test all CRUD operations
  const componentSuccess = await testComponentCRUD();
  const teamSuccess = await testTeamCRUD();
  const posterSuccess = await testPosterCRUD();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Components CRUD: ${componentSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Team Members CRUD: ${teamSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Posters CRUD: ${posterSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = componentSuccess && teamSuccess && posterSuccess;
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed!'}`);
}

// Run the tests
runTests().catch(console.error);