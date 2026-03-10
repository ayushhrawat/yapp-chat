import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { MongoClient, ObjectId} from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection
const MONGODB_URI = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;
const DB_NAME = process.env.VITE_MONGODB_DATABASE || process.env.MONGODB_DATABASE || 'yapp-chat';

let db;
let client;

async function connectToDatabase() {
  try {
  client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
  console.log('✅ Connected to MongoDB:', DB_NAME);
  } catch (error) {
  console.error('❌ MongoDB connection error:', error);
  }
}

connectToDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store online users and their socket IDs
const onlineUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
 console.log('🔌 User connected:', socket.id);
  
 const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);
    
  console.log(`👤 User ${userId} mapped to socket ${socket.id}`);
  console.log(`📊 Total online users:`, onlineUsers.size);
    
    // Broadcast user online status
    io.emit('user_online', { userId });
  }

  // Join chat room
  socket.on('join_room', (roomId) => {
   socket.join(roomId);
  console.log(`✅ User ${userId} joined room: ${roomId}`);
   
   // Log all sockets in this room
  const room = io.sockets.adapter.rooms.get(roomId);
   if (room) {
   console.log(`👥 Users in room ${roomId}:`, Array.from(room).map(socketId => ({
      socketId,
      userId: userSockets.get(socketId)
    })));
   }
  });

  // Send message
  socket.on('send_message', (data) => {
  const { roomId, message, senderId, senderName, timestamp } = data;
    
  console.log('📨 Server received send_message:', { roomId, senderId, message });
  console.log('📢 Broadcasting to room:', roomId);
    
   // Check who's in the room before broadcasting
 const room = io.sockets.adapter.rooms.get(roomId);
   if (room) {
  console.log(`👥 Users in room ${roomId}:`, Array.from(room).map(socketId => ({
      socketId,
      userId: userSockets.get(socketId)
    })));
   } else {
  console.log(`❌ Room ${roomId} does not exist or is empty!`);
   }
    
    // Broadcast to room
    io.to(roomId).emit('receive_message', {
      id: Date.now().toString(),
    senderId,
    senderName,
      message,
      timestamp,
      type: 'text',
      roomId // Include roomId for client-side filtering
    });
    
  console.log('✅ Message broadcast to room');
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { roomId, userId, isTyping } = data;
    socket.to(roomId).emit('user_typing', { userId, isTyping });
  });

  // Video call events
  socket.on('initiate_call', (data) => {
    const { callerId, receiverId, callType } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming_call', {
        callerId,
        callType,
        callId: Date.now().toString()
      });
    }
  });

  socket.on('accept_call', (data) => {
    const { callId, receiverId, zegoData } = data;
    const callerSocketId = onlineUsers.get(data.callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', {
        callId,
        receiverId,
        zegoData
      });
    }
  });

  socket.on('reject_call', (data) => {
    const { callId, callerId } = data;
    const callerSocketId = onlineUsers.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected', { callId });
    }
  });

  socket.on('end_call', (data) => {
    const { callId, userId } = data;
    // Notify all participants
    socket.broadcast.emit('call_ended', { callId, userId });
  });

  // Leave room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room: ${roomId}`);
  });

  // Disconnect
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Clerk Webhook Handler - Auto Sync Users to Supabase
app.post('/api/webhooks/clerk', async (req, res) => {
  try {
    const eventType = req.headers['x-clerk-event-type'];
    const payload = req.body;

    console.log('🔔 Received Clerk webhook:', eventType);

    // We only care about user events for now
    if (!eventType || !eventType.startsWith('user.')) {
      return res.status(200).json({ received: true });
    }

    // Extract user data from Clerk payload
    const clerkUser = payload.data;
    const userData = {
      clerk_id: clerkUser.id,
      username: clerkUser.username || 
                `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.toLowerCase().trim().replace(/\s+/g, '_') ||
                clerkUser.email_addresses?.[0]?.email_address?.split('@')[0] ||
                `user_${clerkUser.id.slice(-6)}`,
      email: clerkUser.email_addresses?.[0]?.email_address,
      avatar_url: clerkUser.image_url || clerkUser.profile_image_url,
      first_name: clerkUser.first_name,
      last_name: clerkUser.last_name
    };

    console.log('🔄 Auto-syncing user from webhook:', userData);

    // Call Supabase Edge Function to sync user
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/auto-sync-user`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to sync with Supabase');
    }

    console.log('✅ User synced successfully via webhook:', result.user?.id);
    res.status(200).json({ success: true, user: result.user });

  } catch (error) {
    console.error('❌ Error processing Clerk webhook:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/webhooks/clerk`);
});
