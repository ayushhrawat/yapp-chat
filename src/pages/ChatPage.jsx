import React, { useState, useEffect } from 'react';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import Profile from '../components/Auth/Profile';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import { SocketProvider, useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  searchUsersInMongoDB, 
  createOrGetConversation,
  getUserConversations,
  markMessagesAsRead,
  getConversationMessages
} from '../services/mongodb-client';
import './ChatPage.css';
import '../styles/dark-mode.css';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Main ChatPage component
const ChatPage = () => {
 return (
   <SocketProvider supabaseUserId={useAuth().supabaseUserId}>
     <ChatPageContent />
   </SocketProvider>
 );
};

// Inner component that uses socket
function ChatPageContent() {
 const { user } = useUser();
const { supabaseUserId } = useAuth();
const { socket, isConnected } = useSocket();
const { theme, setTheme } = useTheme();
const navigate = useNavigate();
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [isAboutExpanded, setIsAboutExpanded] = useState(false);
const [activeChat, setActiveChat] = useState(null);
const [conversations, setConversations] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [activeChatData, setActiveChatData] = useState(null);
const [lastUpdate, setLastUpdate] = useState(0);

 // Helper function to format conversations with user details
 const formatConversations = async (freshConvos) => {
 const allParticipantIds = new Set();
  freshConvos.forEach(conv => {
   conv.participants.forEach(pid => allParticipantIds.add(pid));
  });
  
 const usersCollection = {};
  if (allParticipantIds.size > 0) {
  try {
     const response = await fetch(`${API_URL}/api/users/by-ids`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(allParticipantIds) })
      });
      
    if (response.ok) {
       const users = await response.json();
        users.forEach(u => {
          usersCollection[u.clerkId] = u;
        });
      }
    } catch (error) {
     console.error('Error fetching user details:', error);
    }
  }
  
 return freshConvos.map(conv => {
 const otherUserId = conv.participants.find(p => p !== supabaseUserId);
 const otherUser = usersCollection[otherUserId];
    
   // Format last message preview based on type
  let lastMessagePreview = conv.lastMessage || 'No messages yet';
  if (conv.lastMessageType && conv.lastMessageType !== 'text') {
   const mediaTypes = {
      'image': '📷 Photo',
       'video': '🎥 Video',
      'audio': '🎵 Audio',
       'file': '📄 File'
     };
    lastMessagePreview = mediaTypes[conv.lastMessageType] || '📎 Media';
    }
    
 return {
    id: conv.id,
    name: otherUser ? (otherUser.username || otherUser.email?.split('@')[0]) : 'User',
    lastMessage: lastMessagePreview,
    lastMessageTime: conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '',
    time: conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '',
    unread: conv.unreadCount?.[supabaseUserId] || 0,
    participants: conv.participants,
    avatar: otherUser?.avatarUrl || null
   };
  });
};

const refreshConversations = async () => {
 console.log('🔄 Refreshing conversations from parent...');
 if (!supabaseUserId) return;
  
 const freshConvos = await getUserConversations(supabaseUserId);
console.log('📥 Refreshed conversations:', freshConvos.length);
  
 const formattedConvos = await formatConversations(freshConvos);
 setConversations(formattedConvos);
  
 setLastUpdate(Date.now());
 };

 // Expose refresh function globally
 useEffect(() => {
  window.refreshConversations = refreshConversations;
 return () => {
    delete window.refreshConversations;
  };
 }, [supabaseUserId]);

 // Load conversations when user is synced
 useEffect(() => {
  if (!supabaseUserId) {
  console.log('⏳ Waiting for user sync...');
  return;
  }

 console.log('📋 Fetching conversations...');
  getUserConversations(supabaseUserId).then(async (fetchedConvos) => {
  console.log('📬 Conversations loaded:', fetchedConvos.length);
  console.log('Socket status:', { exists: !!socket, connected: socket?.connected, isConnected });
  const formattedConvos = await formatConversations(fetchedConvos);
  setConversations(formattedConvos);
  });
 }, [supabaseUserId]);

 // Auto-join all conversation rooms
 useEffect(() => {
 console.log('🔍 Checking join conditions:', {
   hasSocket: !!socket,
   isConnected,
   hasConvos: conversations.length > 0,
  convCount: conversations.length,
   userId: supabaseUserId
  });
  
  if (!socket || !isConnected) {
  console.log('⏳ Waiting for socket connection...');
  return;
  }
  
  if (conversations.length === 0) {
  console.log('⏳ Waiting for conversations to load...');
  return;
  }
  
 console.log('🚪 JOINING ALL ROOMS! Count:', conversations.length);
 conversations.forEach((conv, idx) => {
  console.log(`  ${idx + 1}. Room: ${conv.id}`);
   socket.emit('join_room', conv.id);
  });
 console.log('✅ All rooms joined successfully!');
  
  setTimeout(() => {
  console.log('📋 Verifying room membership...');
  }, 500);
 }, [socket, isConnected, conversations, supabaseUserId]);

 // Listen for incoming messages
 useEffect(() => {
  if (!socket || !isConnected) {
  console.log('⏳ Message listener waiting for socket...');
  return;
  }

 console.log('✅ Message listener active');

 const handleReceiveMessage = async (messageData) => {
  console.log('📩=== INCOMING MESSAGE ===');
  console.log('Room ID:', messageData.roomId);
  console.log('Message:', messageData.message);
  console.log('Sender:', messageData.senderId);
  console.log('Current user:', supabaseUserId);
   
  const isFromMe = messageData.senderId === supabaseUserId;
  console.log('🔍 Is from me?', isFromMe);
   
  if (isFromMe) {
   console.log('💭 This is my own message broadcast back - still refreshing UI');
   }
    
   await new Promise(resolve => setTimeout(resolve, 200));
    
  console.log('🔄 Refreshing conversations from database...');
  const freshConvos = await getUserConversations(supabaseUserId);
  console.log('📥 Got', freshConvos.length, 'conversations');
   
  if (freshConvos.length > 0) {
    freshConvos.forEach((conv, idx) => {
    console.log(`  [${idx}] Conv ID: ${conv.id}, LastMsg: "${conv.lastMessage}", Updated: ${conv.updatedAt}`);
    });
   } else {
   console.warn('⚠️ NO CONVERSATIONS FOUND!');
   }
   
  const formattedConvos = await formatConversations(freshConvos);
  setConversations(formattedConvos);
    
  console.log('✅ Conversations updated in UI!');
  setLastUpdate(Date.now());
  };

  socket.on('receive_message', handleReceiveMessage);
  
 return () => {
   socket.off('receive_message', handleReceiveMessage);
  };
 }, [socket, isConnected, supabaseUserId]);

 // Poll for new conversations every 5 seconds
 useEffect(() => {
  if (!supabaseUserId) return;
  
 console.log('⏰ Starting conversation poller...');
  
 const pollInterval = setInterval(async () => {
  console.log('🔍 Polling for new conversations...');
  const freshConvos = await getUserConversations(supabaseUserId);
    
  if (freshConvos.length > conversations.length) {
   console.log('🆕 Found new conversations!', freshConvos.length);
   const formattedConvos = await formatConversations(freshConvos);
   setConversations(formattedConvos);
   setLastUpdate(Date.now());
   }
  }, 5000);
  
 return () => {
  console.log('⏹️ Stopping conversation poller');
   clearInterval(pollInterval);
  };
 }, [supabaseUserId, conversations.length]);

 // Join specific room when chat is selected
 useEffect(() => {
  if (activeChat && socket && isConnected) {
   socket.emit('join_room', activeChat);
  return () => {
    socket.emit('leave_room', activeChat);
   };
  }
 }, [activeChat, socket, isConnected]);

 const handleSearchUsers = async (query) => {
  setSearchQuery(query);
    
  if (!query.trim()) {
  setSearchResults([]);
  setIsSearching(false);
  return;
  }

  try {
  const results = await searchUsersInMongoDB(query, user.id);
  const formattedResults = results.map(result => ({
    ...result,
    display_name: result.username || result.email?.split('@')[0] || 'User'
   }));

  setSearchResults(formattedResults);
  setIsSearching(formattedResults.length > 0);
  } catch (error) {
  console.error('Error searching users:', error);
  setSearchResults([]);
  setIsSearching(false);
  }
 };

 const handleStartConversation = async (targetUser) => {
  try {
  console.log('💬 Starting conversation with:', targetUser);
  console.log('  Target User ID:', targetUser.id);
  console.log('  Target Username:', targetUser.username);
  console.log('  Target ClerkId:', targetUser.clerkId);
    
  if (!user || !supabaseUserId) {
   console.error('User not synced');
   return;
   }

  console.log('  My ID (user.id):', user.id);
  console.log('  My Supabase ID:', supabaseUserId);
    
  const conversation = await createOrGetConversation(user.id, targetUser.clerkId || targetUser.id);
      
  if (conversation) {
   console.log('✅ Conversation created:', conversation);
   console.log('  Participants:', conversation.participants);
    
   setActiveChat(conversation.id);
   setActiveChatData({
     id: conversation.id,
     name: targetUser.display_name || targetUser.username || targetUser.email,
     avatar: targetUser.avatarUrl || targetUser.avatar_url,
     participants: conversation.participants,
     lastMessage: conversation.lastMessage
    });

    await markMessagesAsRead(conversation.id, user.id);
   setSearchQuery('');
   setSearchResults([]);
   setIsSearching(false);
   }
  } catch (error) {
  console.error('Error starting conversation:', error);
  }
 };

 const handleSelectChat = (chat) => {
 console.log('📱 Selecting chat:', chat);
  setActiveChat(chat.id);
  
 const fullConversation = conversations.find(conv => conv.id === chat.id);
  if (fullConversation) {
  setActiveChatData({
    id: fullConversation.id,
    name: fullConversation.name,
    avatar: fullConversation.avatar,
    participants: fullConversation.participants,
    lastMessage: fullConversation.lastMessage
   });
  } else {
  setActiveChatData(chat);
  }
    
  if (user && chat.id) {
   markMessagesAsRead(chat.id, user.id).catch(console.error);
  }
 };

 return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="profile-avatar-wrapper">
              <Profile showOnlyAvatar={true} />
              <img src="/images/logo.png" alt="Logo" className="app-logo" />
            </div>
            <button className="settings-icon-btn" onClick={() => setIsSettingsOpen(true)}>
              ⚙️
            </button>
          </div>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.trim()) {
                  handleSearchUsers(searchQuery);
                }
              }
            }}
            className="search-input"
          />
          
          {isSearching && (
            <div className="search-results">
              {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                  <div
                    key={`${result.id || result.clerkId || index}`}
                    className="search-result-item"
                    onClick={() => handleStartConversation(result)}
                  >
                    <div className="search-avatar">
                      {result.avatarUrl || result.avatar_url ? (
                        <img src={result.avatarUrl || result.avatar_url} alt={result.display_name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {result.display_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {result.isOnline && <span className="online-indicator"></span>}
                    </div>
                    <div className="search-info">
                      <h4>{result.display_name}</h4>
                      <span className="status">{result.isOnline ? 'Active now' : 'Offline'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </div>

        <ChatList 
          key={lastUpdate}
          chats={conversations}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
        <ChatWindow 
          chat={activeChatData}
          currentUserId={user?.id}
          supabaseUserId={supabaseUserId}
          socket={socket}
        />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="settings-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="close-settings" onClick={() => setIsSettingsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="settings-content">
              {/* App Appearance */}
              <div className="setting-section">
                <h3>App Appearance</h3>
                <div className="setting-option">
                  <label>Theme</label>
                  <div className="theme-toggle">
                    <button 
                      className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      ☀️ Light
                    </button>
                    <button 
                      className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      🌙 Dark
                    </button>
                  </div>
                </div>
              </div>

              {/* About App */}
              <div className="setting-section">
                <div className="about-header" onClick={() => setIsAboutExpanded(!isAboutExpanded)}>
                  <h3>About App</h3>
                  <button className="expand-btn">
                    {isAboutExpanded ? '▲' : '▼'}
                  </button>
                </div>
                {isAboutExpanded && (
                  <div className="setting-option">
                    <div className="about-content">
                      <p>
                        Yapp is a modern real-time messaging application built with React, 
                        Socket.IO, and MongoDB. Features include instant messaging, online 
                        status indicators, message read receipts, and video call integration. 
                        The app uses Clerk for secure authentication and Supabase for 
                        database management. With its clean UI, dark/light themes, and 
                      responsive design, Yapp provides seamless communication across all 
                        devices. Connect with friends instantly and enjoy smooth, 
                      real-time conversations.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Help */}
              <div className="setting-section">
                <h3>Help</h3>
                <div className="setting-option">
                  <button className="help-btn" onClick={() => navigate('/faq')}>
                    📖 Help Center
                  </button>
                  <button className="help-btn" onClick={() => navigate('/faq')}>
                    ❓ FAQ
                  </button>
                </div>
              </div>

              {/* Contact Developer */}
              <div className="setting-section">
                <h3>Contact Developer</h3>
                <div className="setting-option">
                  <a 
                    href="mailto:rawatayush412@gmail.com" 
                    className="contact-link"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = 'mailto:rawatayush412@gmail.com';
                    }}
                  >
                    📧 rawatayush412@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
