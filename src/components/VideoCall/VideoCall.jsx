import React, { useEffect, useRef, useState } from 'react';
import { 
  initializeZego, 
  createLocalStream, 
  joinRoom, 
  startPublishing,
  cleanupZego 
} from '../../config/zego';
import './VideoCall.css';

const VideoCall = ({ callType, remoteUserId, localUserId, onEndCall }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const zegoEngineRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // Generate a unique room ID based on both users
  const roomID = `room_${[localUserId, remoteUserId].sort().join('_')}`;
  const streamID = `stream_${localUserId}_${Date.now()}`;

  useEffect(() => {
   const initCall = async () => {
     try {
       console.log('📞 Initializing call...', { callType, remoteUserId, localUserId });
        
        // Initialize Zego
       const engine = initializeZego();
        if (!engine) {
         console.error('Failed to initialize Zego');
          alert('Failed to initialize video call service. Please check your connection.');
          onEndCall();
          return;
        }
        zegoEngineRef.current = engine;

        // Create local stream
       console.log('Creating local stream...');
       const stream = await createLocalStream(localUserId, callType);
        localStreamRef.current = stream;

        // Play local stream
        if (localVideoRef.current && stream) {
         console.log('Playing local stream...');
          stream.play(localVideoRef.current);
        }

        // Join room
       console.log('Joining room:', roomID);
        await joinRoom(roomID, stream);

        // Start publishing
       console.log('Starting publishing...');
        await startPublishing(roomID, streamID);

        setIsConnected(true);
       console.log('✅ Call initialized successfully');

        // Listen for remote streams
       const handleRemoteStreamAdded = (event) => {
         console.log('Remote stream added:', event.detail);
          if (remoteVideoRef.current && event.detail?.stream) {
            setTimeout(() => {
              event.detail.stream.play(remoteVideoRef.current);
            }, 500);
          }
        };

        window.addEventListener('remote-stream-added', handleRemoteStreamAdded);
        window.addEventListener('remote-stream-removed', () => {
         console.log('Remote stream removed');
        });

        // Clean up on unmount
        return () => {
         console.log('Cleaning up call...');
          window.removeEventListener('remote-stream-added', handleRemoteStreamAdded);
          endCall();
        };
      } catch (error) {
       console.error('Error initializing call:', error);
        alert(`Error starting call: ${error.message}`);
        onEndCall();
      }
    };

    initCall();

    return () => {
      endCall();
    };
  }, [callType, remoteUserId, localUserId]);

  const endCall = async () => {
   try {
     console.log('Ending call...');
      await cleanupZego();
      localStreamRef.current = null;
    } catch (error) {
     console.error('Error ending call:', error);
    }
    onEndCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.enableAudio(!isMuted);
      setIsMuted(!isMuted);
     console.log(isMuted ? 'Unmuted' : 'Muted');
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.enableVideo(!isCameraOff);
      setIsCameraOff(!isCameraOff);
     console.log(isCameraOff ? 'Camera on' : 'Camera off');
    }
  };

 return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="video-wrapper local-video">
          <div ref={localVideoRef} className="video-element"></div>
          <span className="video-label">You</span>
        </div>
        <div className="video-wrapper remote-video">
          <div ref={remoteVideoRef} className="video-element"></div>
          <span className="video-label">Remote User</span>
        </div>
      </div>

      <div className="call-controls">
        <button 
          className={`control-btn ${isMuted ? 'active' : ''}`} 
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        
        <button 
          className="control-btn end-call" 
          onClick={endCall}
          title="End Call"
        >
          📞
        </button>
        
        <button 
          className={`control-btn ${isCameraOff ? 'active' : ''}`} 
          onClick={toggleCamera}
          title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {isCameraOff ? '📷' : '📹'}
        </button>
      </div>

      {!isConnected && (
        <div className="connecting-overlay">
          <div className="spinner"></div>
          <p>Connecting...</p>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
