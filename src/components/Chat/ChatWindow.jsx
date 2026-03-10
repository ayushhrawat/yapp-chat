import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { getConversationMessages, sendMessage as sendMongoDBMessage } from '../../services/mongodb-client';
import VideoCallPage from '../../pages/VideoCallPage';
import MediaUpload from './MediaUpload';
import MediaMessage from './MediaMessage';
import { askGroqAI, isAICommand, extractAIQuestion, getAITypingIndicator } from '../../services/groq';
import './ChatWindow.css';

const ChatWindow = ({ chat, currentUserId, supabaseUserId, socket }) => {
 const [messages, setMessages] = useState([]);
 const [newMessage, setNewMessage] = useState('');
 const [isTyping, setIsTyping] = useState(false);
 const [isLoading, setIsLoading] = useState(true);
 const [showVideoCall, setShowVideoCall] = useState(false);
 const [callType, setCallType] = useState(null);
 const [pendingMedia, setPendingMedia] = useState(null);
 const [isAIResponding, setIsAIResponding] = useState(false);
 const messagesEndRef = useRef(null);
 const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chat || !currentUserId) return;

  console.log('💬 Loading messages for conversation:', chat.id);
    
    // Load messages from MongoDB
   getConversationMessages(chat.id).then((fetchedMessages) => {
    console.log('📨 Messages loaded:', fetchedMessages.length);
    setMessages(fetchedMessages.map(msg => ({
      id: msg.id,
      sender_id: msg.senderId,
      content: msg.content,
      created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
        message_type: msg.type || 'text'
      })));
    setIsLoading(false);
    });
  }, [chat, currentUserId]);

  // Listen for incoming messages via Socket.IO
  useEffect(() => {
    if (!socket || !chat || !supabaseUserId) return;

  const handleReceiveMessage = (messageData) => {
   console.log('📩 Received message:', messageData);
   console.log('Current room:', chat.id, 'Message room:', messageData.roomId);
      
      // Add message to the list if it's for this room
      if (messageData.roomId === chat.id) {
    setMessages(prevMessages => {
          // Check if message already exists to avoid duplicates
      const exists = prevMessages.some(m => m.id === messageData.id);
          if (exists) return prevMessages;
          
         console.log('✅ Adding received message to display');
          return [...prevMessages, {
            id: messageData.id,
         sender_id: messageData.senderId,
         content: messageData.message,
         created_at: messageData.timestamp,
            message_type: messageData.type || 'text'
          }];
        });
      } else {
     console.log('❌ Message room does not match current chat');
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, chat, supabaseUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

 const handleSendMessage = async (e) => {
 e.preventDefault();
 e.stopPropagation();
 
 // Prevent any default form behavior
 if (e.nativeEvent) {
   e.nativeEvent.stopImmediatePropagation();
 }
 
  // Check for AI command FIRST (before media check)
 if (isAICommand(newMessage)) {
 const question = extractAIQuestion(newMessage);
      
  if (!question.trim()) {
     alert('Please enter a question after/ask. Example: /ask What is the weather today?');
    setNewMessage('');
   return;
   }

    // Clear any pending media IMMEDIATELY
  setPendingMedia(null);

   // Show typing indicator
  setIsAIResponding(true);
  const typingIndicator = getAITypingIndicator();
      
    // Add temporary AI typing message
  const tempMessageId = `temp_ai_${Date.now()}`;
  setMessages(prev => [...prev, {
    id: tempMessageId,
    sender_id: 'ai_system',
   content: typingIndicator,
    created_at: new Date().toISOString(),
   message_type: 'text',
    is_temporary: true
  }]);

  try {
      // First, save the user's question to database
     const questionResult = await sendMongoDBMessage(chat.id, supabaseUserId, newMessage);
        
     if (questionResult.success) {
        // Emit user's question via Socket.IO
       if (socket) {
          socket.emit('send_message', {
            roomId: chat.id,
           message: newMessage,
            senderId: supabaseUserId,
            senderName: currentUserId,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Get AI response from Groq
     const aiResult = await askGroqAI(question);
        
      // Remove temporary typing message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        
     if (aiResult.success) {
          // Send AI response as a message from "AI Assistant"
       const aiResponse = aiResult.response;
          
          // Save AI response to database with SPECIAL sender ID
       const result = await sendMongoDBMessage(
            chat.id, 
           'ai_system',  // ← Use special sender ID so it appears as received
           `🤖 AI Response:\n\n${aiResponse}`,
           'text'
          );
          
       if (result.success) {
        console.log('✅ AI response sent successfully');
            
            // Emit via Socket.IO with AI sender info
        if (socket) {
              socket.emit('send_message', {
              roomId: chat.id,
            message: `🤖 AI Response:\n\n${aiResponse}`,
                senderId: 'ai_system',  // ← Special sender for AI
                senderName: 'AI Assistant',
                timestamp: new Date().toISOString()
              });
            }
            
          // Reload messages
          getConversationMessages(chat.id).then((fetchedMessages) => {
            setMessages(fetchedMessages.map(msg => ({
              id: msg.id,
              sender_id: msg.senderId,
             content: msg.content,
              created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
             message_type: msg.type || 'text'
            })));
          });
            
         if (window.refreshConversations) {
            window.refreshConversations();
          }
        }
      } else {
        // Show error message
        alert(`AI Error: ${aiResult.error}`);
       console.error('❌ AI failed:', aiResult.error);
      }
    } catch (error) {
     console.error('Error getting AI response:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      alert('Failed to get AI response. Please try again.');
    } finally {
      setIsAIResponding(false);
    }
      
    setNewMessage('');
   return;
  }
  
  // Send media message (only if not an AI command)
  if (pendingMedia) {
  try {
 console.log('📤 Sending media message:', pendingMedia);
 console.log('🔍 Current pendingMedia state:', pendingMedia);
      
 const result = await sendMongoDBMessage(
       chat.id, 
       supabaseUserId, 
       pendingMedia.base64, 
       pendingMedia.type,
       pendingMedia.name,
       pendingMedia.size
     );
      
 console.log('📨 Send result:', result);
    
  if (result.success) {
 console.log('✅ Media sent successfully');
 console.log('🗑️ Clearing preview...');
      setPendingMedia(null);
 console.log('👀 Preview cleared, pendingMedia should be null now');
      
      // Emit via Socket.IO
  if (socket) {
        socket.emit('send_message', {
          roomId: chat.id,
      message: pendingMedia.base64,
          senderId: supabaseUserId,
          senderName: currentUserId,
          timestamp: new Date().toISOString(),
          type: pendingMedia.type,
          fileName: pendingMedia.name,
          fileSize: pendingMedia.size
        });
      }
      
      // Reload messages
     getConversationMessages(chat.id).then((fetchedMessages) => {
       setMessages(fetchedMessages.map(msg => ({
         id: msg.id,
         sender_id: msg.senderId,
     content: msg.content,
     created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
     message_type: msg.type || 'text',
         file_name: msg.fileName,
         file_size: msg.fileSize
       })));
      });
      
  if (window.refreshConversations) {
       window.refreshConversations();
      }
    } else {
 console.error('❌ Failed to send media:', result.error);
  alert('Failed to send media. Please try again.');
    }
   } catch (error) {
 console.error('Error sending media:', error);
  alert('Failed to send media. Please try again.');
   }
 return;
  }
  
  // Send text message
  if (!newMessage.trim() || !chat || !supabaseUserId) return;

  try {
  console.log('📨 Sending message:', newMessage);

    // Check if this is an AI command (/ask)
  if (isAICommand(newMessage)) {
    const question = extractAIQuestion(newMessage);
      
     if (!question.trim()) {
       alert('Please enter a question after/ask. Example: /ask What is the weather today?');
        setNewMessage('');
      return;
      }

      // Show typing indicator
      setIsAIResponding(true);
    const typingIndicator = getAITypingIndicator();
      
      // Add temporary AI typing message
    const tempMessageId = `temp_ai_${Date.now()}`;
      setMessages(prev => [...prev, {
       id: tempMessageId,
        sender_id: 'ai_system',
      content: typingIndicator,
        created_at: new Date().toISOString(),
      message_type: 'text',
        is_temporary: true
      }]);

    try {
        // Get AI response from Groq
      const aiResult = await askGroqAI(question);
        
        // Remove temporary typing message
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        
      if (aiResult.success) {
          // Send AI response as a message from "AI Assistant"
        const aiResponse = aiResult.response;
          
          // Save AI response to database
        const result = await sendMongoDBMessage(
            chat.id, 
            supabaseUserId, 
           `🤖 AI Response:\n\n${aiResponse}`,
           'text'
          );
          
        if (result.success) {
          console.log('✅ AI response sent successfully');
            
            // Emit via Socket.IO
          if (socket) {
              socket.emit('send_message', {
               roomId: chat.id,
              message: `🤖 AI Response:\n\n${aiResponse}`,
                senderId: supabaseUserId,
                senderName: currentUserId,
                timestamp: new Date().toISOString()
              });
            }
            
            // Reload messages
            getConversationMessages(chat.id).then((fetchedMessages) => {
              setMessages(fetchedMessages.map(msg => ({
               id: msg.id,
                sender_id: msg.senderId,
              content: msg.content,
                created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
              message_type: msg.type || 'text'
              })));
            });
            
          if (window.refreshConversations) {
              window.refreshConversations();
            }
          }
        } else {
          // Show error message
          alert(`AI Error: ${aiResult.error}`);
        console.error('❌ AI failed:', aiResult.error);
        }
      } catch (error) {
      console.error('Error getting AI response:', error);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        alert('Failed to get AI response. Please try again.');
      } finally {
        setIsAIResponding(false);
      }
      
      setNewMessage('');
    return;
    }

    // Regular message sending logic...
   const result = await sendMongoDBMessage(chat.id, supabaseUserId, newMessage);
      
    if (result.success) {
     console.log('✅ Message sent successfully');
     setNewMessage('');
      
      // Emit via Socket.IO for real-time delivery to other users
      if (socket) {
        socket.emit('send_message', {
          roomId: chat.id,
          message: newMessage,
         senderId: supabaseUserId,
         senderName: currentUserId, // Include Clerk ID for reference
          timestamp: new Date().toISOString()
        });
      }
      
      // Reload messages to show the new one locally
     getConversationMessages(chat.id).then((fetchedMessages) => {
      setMessages(fetchedMessages.map(msg => ({
          id: msg.id,
        sender_id: msg.senderId,
         content: msg.content,
        created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
         message_type: msg.type || 'text'
        })));
      });
      
      // Trigger parent component to refresh conversation list
   if (window.refreshConversations) {
       window.refreshConversations();
     }
    } else {
     console.error('❌ Failed to send message:', result.error);
    }
  } catch (error) {
   console.error('Error sending message:', error);
  }
};

 const handleTyping = (e) => {
   setNewMessage(e.target.value);
    
    // Optional: Keep Socket.IO typing indicators if needed
    if (socket && !isTyping) {
      socket.emit('typing', { roomId: chat.id, userId: currentUserId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
     clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('typing', { roomId: chat.id, userId: currentUserId, isTyping: false });
      }
     setIsTyping(false);
    }, 1000);
  };

  const handleMediaSelect = (mediaData) => {
  setPendingMedia(mediaData);
};

const handleRemoveMedia = () => {
  setPendingMedia(null);
};

  if (!chat) {
    return (
      <div className="chat-window">
        <div className="no-chat-selected">
          <h2>Select a chat to start messaging</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {showVideoCall ? (
        <div className="video-call-overlay">
          <button className="close-call-btn" onClick={() => { setShowVideoCall(false); setCallType(null); }}>✕</button>
          <VideoCallPage 
            localUserId={supabaseUserId}
            remoteUserId={chat.id}
            callType={callType}
            onClose={() => {
              setShowVideoCall(false);
              setCallType(null);
            }}
          />
        </div>
      ) : (
        <>
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="header-avatar">
            {chat.avatar ? (
              <img src={chat.avatar} alt={chat.name} />
            ) : (
              <div className="header-avatar-placeholder">
                {(chat.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="header-info">
            <h3>{chat.name}</h3>
            <span className="status">{chat.online ? 'Active now' : 'Offline'}</span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            className="header-btn" 
            title="Video Call"
            onClick={() => {
              if (!supabaseUserId) {
                alert('Please wait for your profile to load before starting a call');
               return;
              }
              setCallType('video');
              setShowVideoCall(true);
            }}
          >
            📹
          </button>
          <button 
            className="header-btn" 
            title="Voice Call"
           onClick={() => {
              if (!supabaseUserId) {
                alert('Please wait for your profile to load before starting a call');
              return;
              }
              setCallType('audio');
              setShowVideoCall(true);
            }}
          >
            📞
          </button>
          <button className="header-btn" title="Info">
            ℹ️
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {isLoading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
               className={`message ${message.sender_id === supabaseUserId ? 'sent' : 'received'}`}
              >
                {message.message_type !== 'text' ? (
                  <MediaMessage 
                   content={message.content}
                    type={message.message_type}
                    fileName={message.file_name}
                    fileSize={message.file_size}
                  />
                ) : (
                  <>
                  <div className="message-bubble">
                    <p>{message.content}</p>
                  </div>
                  <span className="message-time">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  </>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="message received">
                <div className="message-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSendMessage}>
        <MediaUpload 
          onMediaSelect={handleMediaSelect}
          disabled={!!pendingMedia}
        />
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
         className="chat-input"
        />
        <button type="submit" className="send-button">
          ➤
        </button>
      </form>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
