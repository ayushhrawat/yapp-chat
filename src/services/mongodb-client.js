const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

/**
 * 🔁 Sync Clerk user to MongoDB via API
 */
export const syncUserToMongoDB = async (clerkUser) => {
  try {
 console.log('🔄 Syncing user to MongoDB:', clerkUser.id);

const response = await fetch(`${API_URL}/api/users/sync`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ clerkUser })
   });

const result = await response.json();
   
 if (!response.ok) {
   // Handle rate limiting specifically
   if (response.status === 429) {
  console.warn('⚠️ Rate limited, waiting before retry...');
     await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
     // Retry once
   const retryResponse = await fetch(`${API_URL}/api/users/sync`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUser })
     });
   const retryResult = await retryResponse.json();
     if (!retryResponse.ok) {
       throw new Error(retryResult.error || 'Failed to sync user after retry');
     }
   return { success: true, userId: clerkUser.id };
   }
   throw new Error(result.error || 'Failed to sync user');
 }

console.log('✅ User synced successfully:', clerkUser.id);
return { success: true, userId: clerkUser.id };
 } catch (error) {
console.error('❌ Error syncing user to MongoDB:', error);
return { success: false, error: error.message };
 }
};

/**
 * 🔍 Search users by username or email (MongoDB only)
 */
export const searchUsersInMongoDB = async (searchTerm, currentUserId) => {
 try {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
   }

  console.log('🔍 Searching users in MongoDB:', searchTerm);

  const response = await fetch(
     `${API_URL}/api/users/search?query=${encodeURIComponent(searchTerm)}&currentUserId=${encodeURIComponent(currentUserId)}`
    );

  const results = await response.json();
    
  console.log(`✅ Found ${results.length} user(s):`, results);
  return results;
 } catch (error) {
  console.error('❌ Error searching users:', error);
  return [];
 }
};

/**
 * 🌟 Search ALL Clerk users and filter by keyword
 * Fetches all users from Clerk API, then filters locally
 */
export const searchAllClerkUsers = async (searchTerm, currentUserId) => {
 try {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
   }

  console.log('🌟 Searching ALL Clerk users for:', searchTerm);

  // Fetch all users from our backend endpoint
  const response = await fetch(
     `${API_URL}/api/clerk/all-users?query=${encodeURIComponent(searchTerm)}&currentUserId=${encodeURIComponent(currentUserId)}`,
     {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
       }
     }
    );

  if (!response.ok) {
   throw new Error(`Failed to fetch Clerk users: ${response.statusText}`);
  }

  const results = await response.json();
    
  console.log(`✅ Found ${results.length} matching Clerk users`);
  return results;
 } catch (error) {
  console.error('❌ Error searching Clerk users:', error);
  return [];
 }
};

/**
 * 🟢 Update user online status
 */
export const updateUserOnlineStatus = async (clerkId, isOnline) => {
  try {
  const response = await fetch(`${API_URL}/api/users/status`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ clerkId, isOnline })
    });

  const result = await response.json();
    
  if (!response.ok) {
     throw new Error(result.error || 'Failed to update status');
    }

  console.log(`✅ User ${clerkId} marked as ${isOnline ? 'online' : 'offline'}`);
  } catch (error) {
  console.error('Error updating online status:', error);
  }
};

/**
 * 💬 Get user conversations
 */
export const getUserConversations = async (userId) => {
  try {
  console.log('📋 Getting conversations for user:', userId);

  const response = await fetch(`${API_URL}/api/conversations/${userId}`);
  const conversations = await response.json();

  console.log('📬 Conversations loaded:', conversations.length);
   return conversations;
  } catch (error) {
  console.error('Error getting conversations:', error);
   return [];
  }
};

/**
 * 💬 Create or get conversation between two users
 */
export const createOrGetConversation = async (participant1Id, participant2Id) => {
  try {
  console.log('💬 Creating/getting conversation:', { participant1Id, participant2Id });

  const response = await fetch(`${API_URL}/api/conversations`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ participant1Id, participant2Id })
    });

  const conversation = await response.json();
    
  if (!response.ok) {
     throw new Error(conversation.error || 'Failed to create conversation');
    }

  console.log('✅ Conversation created/found:', conversation.id);
   return conversation;
  } catch (error) {
  console.error('❌ Error creating conversation:', error);
   return null;
  }
};

/**
 * 📨 Get messages for a conversation
 */
export const getConversationMessages = async (conversationId) => {
  try {
  const response = await fetch(`${API_URL}/api/messages/${conversationId}`);
  const messages = await response.json();
  return messages;
  } catch (error) {
  console.error('Error getting messages:', error);
   return [];
  }
};

/**
 * 📨 Send a message in a conversation
 */
export const sendMessage = async (conversationId, senderId, content, type = 'text', fileName = null, fileSize = null) => {
  try {
 console.log('📨 Sending message:', { conversationId, senderId, content, type });

const response = await fetch(`${API_URL}/api/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId,
      senderId,
   content,
     type,
     fileName,
     fileSize
    })
   });

const result= await response.json();
   
 if (!response.ok) {
    throw new Error(result.error || 'Failed to send message');
  }

console.log('✅ Message sent successfully');
 return { success: true, messageId: result.messageId };
 } catch (error) {
console.error('❌ Error sending message:', error);
 return { success: false, error: error.message };
 }
};

/**
 * 📖 Mark messages as read
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
  const response = await fetch(`${API_URL}/api/messages/read`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ conversationId, userId })
    });

  const result = await response.json();
    
  if (!response.ok) {
     throw new Error(result.error || 'Failed to mark messages as read');
    }

  console.log('✅ Messages marked as read');
  } catch (error) {
  console.error('Error marking messages as read:', error);
  }
};
