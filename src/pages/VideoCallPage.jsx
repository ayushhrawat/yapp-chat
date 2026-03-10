import React, { useState, useEffect } from 'react';
import VideoCall from '../components/VideoCall/VideoCall';

const VideoCallPage = ({ localUserId, remoteUserId: parentRemoteUserId, callType: parentCallType, onClose }) => {
 const [inCall, setInCall] = useState(false);
 const [callType, setCallType] = useState(parentCallType || 'video');
 const [remoteUserId, setRemoteUserId] = useState(parentRemoteUserId || '');

 // Auto-start call if remoteUserId is provided (from chat window)
 useEffect(() => {
    if (parentRemoteUserId && !inCall && localUserId) {
   console.log('📞 Auto-starting call...', { localUserId, remoteUserId: parentRemoteUserId, callType });
      setInCall(true);
    }
  }, [parentRemoteUserId, localUserId, inCall]);

const handleStartCall = (type) => {
    if (!remoteUserId.trim()) {
      alert('Please enter a user ID to call');
    return;
    }
    if (!localUserId) {
      alert('Local user ID is not available. Please refresh the page.');
    return;
    }
    setCallType(type);
    setInCall(true);
  };

const handleEndCall = () => {
    setInCall(false);
    if (onClose) {
      onClose();
    } else {
      setRemoteUserId('');
    }
  };

  if (inCall) {
   return <VideoCall callType={callType} remoteUserId={remoteUserId} localUserId={localUserId} onEndCall={handleEndCall} />;
  }

return(
   <div style={{ 
     display: 'flex', 
     flexDirection: 'column', 
     alignItems: 'center', 
     justifyContent: 'center', 
    height: '100vh',
     background: '#f0f2f5'
   }}>
     <div style={{
       background: 'white',
       padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
     }}>
       <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Start a Video Call</h2>
       
       <div style={{ marginBottom: '20px' }}>
         <input
           type="text"
           placeholder="Enter user ID to call"
           value={remoteUserId}
           onChange={(e) => setRemoteUserId(e.target.value)}
        style={{
             width: '100%',
             padding: '12px',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
             fontSize: '15px',
             marginBottom: '15px'
           }}
         />
       </div>

       <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
         <button
           onClick={() => handleStartCall('video')}
        style={{
             padding: '12px 30px',
             background: '#0084ff',
          color: 'white',
            border: 'none',
            borderRadius: '8px',
             fontSize: '16px',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             gap: '8px'
           }}
         >
           📹 Video Call
         </button>
         
         <button
           onClick={() => handleStartCall('audio')}
        style={{
             padding: '12px 30px',
             background: '#31a24c',
          color: 'white',
            border: 'none',
            borderRadius: '8px',
             fontSize: '16px',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             gap: '8px'
           }}
         >
           📞 Audio Call
         </button>
       </div>
     </div>
   </div>
 );
};

export default VideoCallPage;
