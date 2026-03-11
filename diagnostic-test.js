/**
 * 🔍 Deployment Diagnostic Script
 * Run this in browser console on your deployed Vercel app
 */

console.log('🔍 Starting Deployment Diagnostics...\n');

// Test 1: Check Environment Variables
console.group('📋 Test 1: Environment Configuration');
console.log('API URL:', import.meta.env.VITE_SERVER_URL);
console.log('Clerk Publishable Key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...');
console.groupEnd();

// Test 2: Test Backend Connectivity
console.group('\n📡 Test 2: Backend API Test');
(async () => {
  try {
    const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    console.log('Testing backend:', apiUrl);
    
    const response = await fetch(`${apiUrl}/api/health`);
    console.log('✅ Backend reachable! Status:', response.status);
  } catch (error) {
    console.error('❌ Backend NOT reachable:', error.message);
    console.error('This means your VITE_SERVER_URL is wrong or backend is down');
  }
  console.groupEnd();
})();

// Test 3: Test User Search
console.group('\n🔍 Test 3: User Search Test');
(async () => {
  try {
    const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    const testQuery = 'test';
    const currentUserId = 'test123';
    
    const url = `${apiUrl}/api/clerk/all-users?query=${testQuery}&currentUserId=${currentUserId}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url);
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search working! Found', data.length, 'users');
      console.log('Sample results:', data.slice(0, 3));
    } else {
      const errorText = await response.text();
      console.error('❌ Search failed with status', response.status);
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Search request failed:', error.message);
  }
  console.groupEnd();
})();

// Test 4: Check Database Connection (via backend)
console.group('\n💾 Test 4: Database Status');
console.log('Note: This requires backend to be running');
console.log('Check your backend logs for database connection status');
console.groupEnd();

// Test 5: Current User Info
console.group('\n👤 Test 5: Current User');
console.log('Check browser storage:');
console.log('Local Storage:', localStorage);
console.log('Session Storage:', sessionStorage);
console.log('Cookies:', document.cookie);
console.groupEnd();

console.log('\n✅ Diagnostics Complete!\n');
console.log('📋 Summary:');
console.log('- Check if API URL is correct (not localhost)');
console.log('- Verify backend is deployed and running');
console.log('- Ensure CORS is configured');
console.log('- Check MongoDB connection in backend logs');
