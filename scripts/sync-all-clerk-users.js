/**
 * Bulk Import Clerk Users to Supabase
 * 
 * This script will:
 * 1. Fetch all users from Clerk API
 * 2. Insert them into Supabase database
 * 3. Show progress and results
 * 
 * USAGE:
 * ------
 * 1. Install dependencies:
 *    npm install node-fetch dotenv
 * 
 * 2. Create .env file with:
 *    CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
 *    SUPABASE_URL=https://your-project.supabase.co
 *    SUPABASE_SERVICE_KEY=your_supabase_service_role_key
 * 
 * 3. Run script:
 *    node scripts/sync-all-clerk-users.js
 */

import fetch from 'node-fetch';
import 'dotenv/config';

// Configuration
const CLERK_API_URL = 'https://api.clerk.com/v1/users';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: Missing Supabase environment variables!');
  console.error('');
  console.error('Please check your .env file has:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_KEY=your_service_role_key');
  console.error('');
  console.error('Your .env file exists but might be missing these values.');
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error('❌ ERROR: Missing CLERK_SECRET_KEY!');
  console.error('');
  console.error('Please add to your .env file:');
  console.error('  CLERK_SECRET_KEY=sk_test_your_key_here');
  console.error('');
  console.error('Get your key from: https://dashboard.clerk.com → API Keys');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully!');
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   Clerk API: ${CLERK_API_URL}`);
console.log('');

// Get all users from Clerk
async function getClerkUsers() {
  try {
    console.log('📥 Fetching users from Clerk API...');
    
    const response = await fetch(CLERK_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Clerk API error: ${error}`);
    }

    const users = await response.json();
    console.log(`✅ Found ${users.length} users in Clerk`);
    return users;
  } catch (error) {
    console.error('❌ Error fetching Clerk users:', error.message);
    throw error;
  }
}

// Sync user to Supabase
async function syncUserToSupabase(clerkUser) {
  try {
    // Extract user data
    const clerkId = clerkUser.id;
    const email = clerkUser.email_addresses?.[0]?.email_address;
    const firstName = clerkUser.first_name;
    const lastName = clerkUser.last_name;
    const imageUrl = clerkUser.image_url;
    
    // Generate username
    let username = clerkUser.username;
    if (!username) {
      username = `${firstName || ''} ${lastName || ''}`.toLowerCase().trim();
      username = username.replace(/\s+/g, '_') || email?.split('@')[0] || `user_${clerkId.slice(-6)}`;
    }
    
    // Clean username for database
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '');

    // Convert created_at from timestamp to ISO string if needed
    let createdAt = new Date().toISOString();
    if (clerkUser.created_at) {
      // Check if it's a timestamp (number) or already a date string
      if (typeof clerkUser.created_at === 'number') {
        createdAt = new Date(clerkUser.created_at).toISOString();
      } else if (!isNaN(Date.parse(clerkUser.created_at))) {
        createdAt = new Date(clerkUser.created_at).toISOString();
      }
    }

    // First, check if user exists by clerk_id
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?clerk_id=eq.${clerkId}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      throw new Error(`Failed to check existing user: ${checkResponse.statusText}`);
    }

    const existingUsers = await checkResponse.json();
    const userData = {
      clerk_id: clerkId,
      username: cleanUsername,
      email: email,
      avatar_url: imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${cleanUsername}`,
      is_online: false,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let response;
    
    if (existingUsers.length > 0) {
      // User exists - UPDATE
      response = await fetch(`${SUPABASE_URL}/rest/v1/users?clerk_id=eq.${clerkId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(userData)
      });
    } else {
      // User doesn't exist - INSERT (let Supabase generate UUID)
      userData.created_at = createdAt;
      response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(userData)
      });
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main sync function
async function syncAllUsers() {
  console.log('🚀 Starting Clerk to Supabase user sync...\n');
  
  try {
    // Get all Clerk users
    const clerkUsers = await getClerkUsers();
    
    let successCount = 0;
    let errorCount = 0;
    
    // Sync each user
    for (let i = 0; i < clerkUsers.length; i++) {
      const user = clerkUsers[i];
      const email = user.email_addresses?.[0]?.email_address || 'No email';
      
      console.log(`[${i + 1}/${clerkUsers.length}] Syncing: ${email}`);
      
      const result = await syncUserToSupabase(user);
      
      if (result.success) {
        console.log(`  ✅ Success -> UUID: ${result.data.id}`);
        successCount++;
      } else {
        console.log(`  ❌ Error: ${result.error}`);
        errorCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Total: ${clerkUsers.length}`);
    console.log('='.repeat(50));
    
    if (errorCount === 0) {
      console.log('🎉 All users synced successfully!');
    } else {
      console.log('⚠️  Some users failed to sync. Check errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the sync
syncAllUsers();
