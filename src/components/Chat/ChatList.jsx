import React from 'react';
import './ChatList.css';

const ChatList = ({ chats, activeChat, onSelectChat }) => {
  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
      </div>
      <div className="chat-items">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="chat-avatar">
              {chat.avatar ? (
                <img src={chat.avatar} alt={chat.name} className="chat-avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {(chat.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {chat.online && <span className="online-indicator"></span>}
            </div>
            <div className="chat-info">
              <div className="chat-top">
                <h3 className="chat-name">{chat.name}</h3>
                <span className="chat-time">{chat.lastMessageTime}</span>
              </div>
              <div className="chat-bottom">
                <p className="chat-preview">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="unread-badge">{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
