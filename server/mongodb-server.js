import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId} from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// MongoDB connection
const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = process.env.VITE_MONGODB_DATABASE || 'yapp-chat';

let db;
let client;

async function connectToDatabase() {
  try {
   client = new MongoClient(MONGODB_URI, {
     serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      tlsAllowInvalidCertificates: true
    });
    await client.connect();
    db = client.db(DB_NAME);
   console.log('✅ Connected to MongoDB:', DB_NAME);
  } catch (error) {
   console.error('❌ MongoDB connection error:', error.message);
   console.log('Retrying connection in 5 seconds...');
   setTimeout(connectToDatabase, 5000);
  }
}

connectToDatabase();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
 cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      process.env.VITE_FRONTEND_URL || '*'
    ],
    methods: ['GET', 'POST'],
   credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store online users and their socket IDs
const onlineUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
 console.log('User connected:', socket.id);
  
 const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
   userSockets.set(socket.id, userId);
    
    // Broadcast user online status
    io.emit('user_online', { userId });
  }

  // Join chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
   console.log(`User ${userId} joined room: ${roomId}`);
  });

  // Send message
  socket.on('send_message', (data) => {
   const { roomId, message, senderId, senderName, timestamp } = data;
    
    console.log('📡 Socket received send_message:', { roomId, message, senderId });
    
    // Broadcast to room WITH roomId included
    io.to(roomId).emit('receive_message', {
     id: Date.now().toString(),
     roomId, // Include roomId so clients know which chat
   senderId,
   senderName,
    message,
      timestamp,
      type: 'text'
    });
    
    console.log('📡 Socket broadcasted to room:', roomId);
  });

  // Typing indicator
  socket.on('typing', (data) => {
   const { roomId, userId, isTyping } = data;
    socket.to(roomId).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
   console.log('User disconnected:', socket.id);
    
   const disconnectedUserId = userSockets.get(socket.id);
   if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
     userSockets.delete(socket.id);
      
      // Broadcast user offline status
      io.emit('user_offline', { userId: disconnectedUserId });
    }
  });
});

// MongoDB API Routes

// Sync user on login
app.post('/api/users/sync', async (req, res) => {
  try {
   if (!db) {
     return res.status(500).json({ error: 'Database not connected' });
    }

   const { clerkUser } = req.body;
   const usersCollection = db.collection('users');

   const email = clerkUser.email_addresses?.[0]?.email_address || '';
   const firstName = clerkUser.first_name || '';
   const lastName = clerkUser.last_name || '';
   const imageUrl = clerkUser.image_url;

    let username = clerkUser.username;
   if (!username) {
     username = `${firstName} ${lastName}`.toLowerCase().trim() 
                || email.split('@')[0] 
                || `user_${clerkUser.id.slice(-6)}`;
     username = username.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    }

   const userData = {
     clerkId: clerkUser.id,
     username: username,
     email: email,
     avatarUrl: imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
      isOnline: true,
      lastSeen: new Date(),
      updatedAt: new Date()
    };

   const existingUser= await usersCollection.findOne({ clerkId: clerkUser.id });

   if (existingUser) {
      await usersCollection.updateOne(
        { clerkId: clerkUser.id },
        { $set: { ...userData, updatedAt: new Date() } }
      );
     console.log('✅ User updated in MongoDB:', clerkUser.id);
    } else {
      await usersCollection.insertOne({ ...userData, createdAt: new Date() });
     console.log('✅ User created in MongoDB:', clerkUser.id);
    }

   res.json({ success: true, userId: clerkUser.id });
  } catch (error) {
   console.error('❌ Error syncing user:', error);
   res.status(500).json({ error: error.message });
  }
});

// Search users
app.get('/api/users/search', async (req, res) => {
 try {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
   }

  const { query, currentUserId} = req.query;
  if (!query || !query.trim()) {
    return res.json([]);
   }

  const usersCollection = db.collection('users');
  const normalizedTerm = query.toLowerCase().trim();

  // More flexible search: match anywhere in username or email
  const results = await usersCollection.find({
     $and: [
       {
         $or: [
           { username: { $regex: normalizedTerm, $options: 'i' } },  // Match anywhere
           { email: { $regex: normalizedTerm, $options: 'i' } }      // Match anywhere
         ]
       },
       { clerkId: { $ne: currentUserId} }
     ]
   }).limit(20).toArray();  // Increased limit to 20 results

  console.log(`🔍 Found ${results.length} users for query: ${query}`);
  res.json(results);
 } catch (error) {
  console.error('❌ Error searching users:', error);
  res.status(500).json({ error: error.message });
 }
});

// Update online status
app.post('/api/users/status', async (req, res) => {
  try {
  if (!db) {
  return res.status(500).json({ error: 'Database not connected' });
    }

   const { clerkId, isOnline } = req.body;
   const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { clerkId },
      { $set: { isOnline, lastSeen: new Date(), updatedAt: new Date() } }
    );

 res.json({ success: true });
  } catch (error) {
   console.error('❌ Error updating status:', error);
 res.status(500).json({ error: error.message });
  }
});

// Get users by IDs
app.post('/api/users/by-ids', async (req, res) => {
 try {
 if (!db) {
 return res.status(500).json({ error: 'Database not connected' });
   }

  const { userIds } = req.body;
  
 if (!userIds || !Array.isArray(userIds)) {
 return res.json([]);
   }
   
  console.log('👥 Fetching users by IDs:', userIds);
  
  const usersCollection = db.collection('users');
  const users = await usersCollection.find({
    clerkId: { $in: userIds }
  }).toArray();
  
  console.log('✅ Found', users.length, 'users');
res.json(users);
 } catch (error) {
  console.error('❌ Error fetching users:', error);
res.status(500).json({ error: error.message });
 }
});

// Get ALL Clerk users and filter by query
app.get('/api/clerk/all-users', async (req, res) => {
 try {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
   }

  const { query, currentUserId} = req.query;
  
  if (!query || !query.trim()) {
    return res.json([]);
   }

  console.log('🌟 Fetching ALL Clerk users, filtering for:', query);

  // Get ALL users from MongoDB (which syncs with Clerk)
  const usersCollection = db.collection('users');
  const normalizedTerm = query.toLowerCase().trim();

  // Fetch all users except current user
  const allUsers = await usersCollection.find({
    clerkId: { $ne: currentUserId }
  }).toArray();

  console.log(`📊 Total users in database: ${allUsers.length}`);

  // Filter locally by keyword (matches anywhere in username, email, or display name)
  const filteredUsers = allUsers.filter(user => {
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const displayName = (user.displayName || '').toLowerCase();
    
    // Match if query appears ANYWHERE in any field
    return username.includes(normalizedTerm) ||
           email.includes(normalizedTerm) ||
           displayName.includes(normalizedTerm);
  });

  console.log(`✅ Filtered to ${filteredUsers.length} matching users`);
  res.json(filteredUsers);
 } catch (error) {
  console.error('❌ Error fetching Clerk users:', error);
  res.status(500).json({ error: error.message });
 }
});

// Get conversations
app.get('/api/conversations/:userId', async (req, res) => {
  try {
  if (!db) {
 return res.status(500).json({ error: 'Database not connected' });
    }

   const { userId} = req.params;
   const conversationsCollection = db.collection('conversations');

   console.log('📋 GET /api/conversations - Fetching for user:', userId);
   console.log('  Query: { participants: "', userId, '" }');

   const conversations = await conversationsCollection
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .toArray();

   console.log('📬 Found', conversations.length, 'conversations');
  if (conversations.length > 0) {
     conversations.forEach((conv, idx) => {
       console.log(`  [${idx}] Conv ID: ${conv._id}, Participants: [${conv.participants.join(', ')}], LastMsg: "${conv.lastMessage || '(none)'}", Updated: ${conv.updatedAt}`);
     });
   } else {
     console.warn('⚠️ No conversations found for user:', userId);
     // Debug: Show total conversations in DB
     const totalConvos = await conversationsCollection.countDocuments();
     console.log('  Total conversations in DB:', totalConvos);
     
     // Show sample of recent conversations
     const sample = await conversationsCollection.find({}).limit(3).toArray();
   if (sample.length > 0) {
       console.log('  Sample conversations:');
       sample.forEach((conv, idx) => {
         console.log(`    [${idx}] ID: ${conv._id}, Participants: [${conv.participants.join(', ')}]`);
       });
     }
   }

 res.json(conversations.map(conv => ({ id: conv._id.toString(), ...conv })));
  } catch (error) {
   console.error('❌ Error getting conversations:', error);
 res.status(500).json({ error: error.message });
  }
});

// Create/get conversation
app.post('/api/conversations', async (req, res) => {
  try {
  if (!db) {
 return res.status(500).json({ error: 'Database not connected' });
    }

   const { participant1Id, participant2Id} = req.body;
   
   console.log('💬 POST /api/conversations - Creating conversation:');
   console.log('  Participant 1:', participant1Id);
   console.log('  Participant 2:', participant2Id);
   
   const conversationsCollection = db.collection('conversations');

   // Find existing conversation with EXACT participant match
   const existingConv = await conversationsCollection.findOne({
     participants: { $all: [participant1Id, participant2Id], $size: 2 }
    });

  if (existingConv) {
     console.log('  ✅ Found existing conversation:', existingConv._id);
   return res.json({ id: existingConv._id.toString(), ...existingConv });
    }

   console.log('  ➕ Creating new conversation...');
   const newConv = {
     participants: [participant1Id, participant2Id],
   createdBy: participant1Id,
   createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: '',
      lastMessageBy: '',
      unreadCount: { [participant1Id]: 0, [participant2Id]: 0 }
    };

   const result = await conversationsCollection.insertOne(newConv);
   console.log('  ✅ Created conversation:', result.insertedId);
   console.log('  Participants:', [participant1Id, participant2Id]);
 res.json({ id: result.insertedId.toString(), ...newConv });
  } catch (error) {
   console.error('❌ Error creating conversation:', error);
 res.status(500).json({ error: error.message });
  }
});

// Get messages
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
   if (!db) {
     return res.status(500).json({ error: 'Database not connected' });
    }

   const { conversationId} = req.params;
   const messagesCollection = db.collection('messages');

   const messages = await messagesCollection
      .find({ conversationId })
      .sort({ timestamp: 1 })
      .toArray();

   res.json(messages.map(msg => ({ id: msg._id.toString(), ...msg })));
  } catch (error) {
   console.error('❌ Error getting messages:', error);
   res.status(500).json({ error: error.message });
  }
});

// Send message
app.post('/api/messages', async (req, res) => {
  try {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
    }

   const { conversationId, senderId, content, type = 'text' } = req.body;
   const messagesCollection = db.collection('messages');
   const conversationsCollection = db.collection('conversations');

   console.log('📨 POST /api/messages - Received:', { conversationId, senderId, content });

   const messageData = {
     conversationId,
    senderId,
     content,
      type,
      status: 'sent',
      timestamp: new Date(),
    readBy: [senderId]
    };

   const result = await messagesCollection.insertOne(messageData);
 console.log('✅ Message inserted:', result.insertedId);

   // Update conversation's last message
 const updateResult= await conversationsCollection.updateOne(
    { _id: new ObjectId(conversationId) },
    { $set: { 
       lastMessage: type === 'text' ? content : `Sent ${type}`,
       lastMessageType: type || 'text',
        lastMessageBy: senderId, 
        updatedAt: new Date() 
      } 
    }
  );
 console.log('🔄 Conversation updated:', updateResult.modifiedCount, 'documents modified');

  res.json({ success: true, messageId: result.insertedId.toString() });
  } catch (error) {
   console.error('❌ Error sending message:', error);
  res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
app.post('/api/messages/read', async (req, res) => {
  try {
   if (!db) {
     return res.status(500).json({ error: 'Database not connected' });
    }

   const { conversationId, userId} = req.body;
   const messagesCollection = db.collection('messages');
   const conversationsCollection = db.collection('conversations');

    await messagesCollection.updateMany(
      {
       conversationId,
       senderId: { $ne: userId },
       readBy: { $ne: userId}
      },
      { $addToSet: { readBy: userId} }
    );

    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { [`unreadCount.${userId}`]: 0 } }
    );

   res.json({ success: true });
  } catch (error) {
   console.error('❌ Error marking messages as read:', error);
   res.status(500).json({ error: error.message });
  }
});

// Export app for Vercel serverless deployment
export { app, server };

// Only start server if not in Vercel/serverless environment
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}/health`);
    console.log(`MongoDB API available at http://localhost:${PORT}/api/`);
  });
}
