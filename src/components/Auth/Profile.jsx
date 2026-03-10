import React, { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import './Profile.css';

const Profile = ({ showOnlyAvatar = false }) => {
  const { user, isLoaded } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isLoaded || !user) {
   return null;
  }

  // If showOnlyAvatar is true, render only the avatar with click to expand
  if (showOnlyAvatar) {
   return (
      <div className={`profile-container minimal ${isExpanded ? 'expanded' : ''}`}>
        <div className="profile-avatar" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.username || user.firstName} />
          ) : (
            <div className="avatar-placeholder">
              {(user.firstName?.charAt(0) || user.username?.charAt(0) || '?').toUpperCase()}
            </div>
          )}
          <span className="online-status"></span>
        </div>
        
        {isExpanded && (
          <div className="profile-details-popup">
            <div className="profile-section">
              <div className="profile-header-info">
                <div className="profile-avatar-large">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt={user.username || user.firstName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(user.firstName?.charAt(0) || user.username?.charAt(0) || '?').toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="profile-name-large">
                  {user.firstName 
                    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
                    : user.username || 'User'}
                </h3>
                <p className="profile-email-large">{user.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>

            <div className="profile-section">
              <h4>Account Information</h4>
              
              <div className="info-row">
                <label>Username:</label>
                <span>{user.username || 'Not set'}</span>
              </div>

              <div className="info-row">
                <label>Email:</label>
                <span>{user.emailAddresses[0]?.emailAddress}</span>
              </div>

              {user.primaryPhoneNumber && (
                <div className="info-row">
                  <label>Phone:</label>
                  <span>{user.primaryPhoneNumber}</span>
                </div>
              )}

              <div className="info-row">
                <label>Member since:</label>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="profile-section">
              <h4>Connected Accounts</h4>
              {user.externalAccounts.length > 0 ? (
                <div className="external-accounts">
                  {user.externalAccounts.map((account) => (
                    <div key={account.id} className="external-account">
                      <span className="provider-icon">{getProviderIcon(account.provider)}</span>
                      <span className="provider-name">{account.provider}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-accounts">No connected accounts</p>
              )}
            </div>

            <div className="profile-actions">
              <SignOutButton>
                <button className="sign-out-btn">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
            
            <button className="close-details" onClick={() => setIsExpanded(false)}>
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

 return (
    <div className={`profile-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="profile-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="profile-avatar">
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.username || user.firstName} />
          ) : (
            <div className="avatar-placeholder">
              {(user.firstName?.charAt(0) || user.username?.charAt(0) || '?').toUpperCase()}
            </div>
          )}
          <span className="online-status"></span>
        </div>
        
        <div className="profile-info-brief">
          <h3 className="profile-name">
            {user.firstName 
              ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
              : user.username || 'User'}
          </h3>
          <p className="profile-email">{user.emailAddresses[0]?.emailAddress}</p>
        </div>

        <button className="expand-toggle">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="profile-details">
          <div className="profile-section">
            <h4>Account Information</h4>
            
            <div className="info-row">
              <label>Username:</label>
              <span>{user.username || 'Not set'}</span>
            </div>

            <div className="info-row">
              <label>Email:</label>
              <span>{user.emailAddresses[0]?.emailAddress}</span>
            </div>

            {user.primaryPhoneNumber && (
              <div className="info-row">
                <label>Phone:</label>
                <span>{user.primaryPhoneNumber}</span>
              </div>
            )}

            <div className="info-row">
              <label>Member since:</label>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4>Connected Accounts</h4>
            {user.externalAccounts.length > 0 ? (
              <div className="external-accounts">
                {user.externalAccounts.map((account) => (
                  <div key={account.id} className="external-account">
                    <span className="provider-icon">{getProviderIcon(account.provider)}</span>
                    <span className="provider-name">{account.provider}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-accounts">No connected accounts</p>
            )}
          </div>

          <div className="profile-actions">
            <SignOutButton>
              <button className="sign-out-btn">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get provider icon
const getProviderIcon = (provider) => {
  const icons = {
    google: '🔵',
    facebook: '📘',
    github: '🐙',
    apple: '🍎',
    linkedin: '💼',
    twitter: '🐦',
  };
 return icons[provider] || '🔗';
};

export default Profile;
