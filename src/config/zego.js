import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

const appId = import.meta.env.VITE_ZEGO_APP_ID;
const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

if (!appId || !serverSecret) {
  console.warn('Zego credentials not configured. Please update .env file');
}

let zegoEngine = null;
let localStream = null;
let remoteStream = null;
let currentRoomId = null;

export const initializeZego = () => {
  if (zegoEngine) return zegoEngine;
  
  try {
    zegoEngine = new ZegoExpressEngine({
      mode: 'live',
      scenario: 'videoCall',
      appId: parseInt(appId) || 0,
      appSign: serverSecret || '',
    });
    
    // Set up event listeners
    zegoEngine.on('roomStreamUpdate', (roomID, updateType, streamList) => {
    console.log('Room stream update:', { roomID, updateType, streamList });
      if (updateType === 'ADD') {
        remoteStream = streamList[0];
        if (remoteStream) {
          window.dispatchEvent(new CustomEvent('remote-stream-added', { detail: { stream: remoteStream } }));
        }
      } else if (updateType === 'DELETE') {
        remoteStream = null;
        window.dispatchEvent(new CustomEvent('remote-stream-removed'));
      }
    });

    zegoEngine.on('roomUserUpdate', (roomID, updateType, userList) => {
    console.log('Room user update:', { roomID, updateType, userList });
    });

    return zegoEngine;
  } catch (error) {
  console.error('Failed to initialize Zego:', error);
    return null;
  }
};

export const getZegoEngine = () => zegoEngine;

export const createLocalStream = async (userId, callType = 'video') => {
  if (!zegoEngine) {
    throw new Error('Zego engine not initialized');
  }

  try {
    // Destroy existing stream if any
    if (localStream) {
      localStream.stop();
      localStream = null;
    }

    localStream = await zegoEngine.createStream({
      userID: userId,
      streamID: `stream_${userId}_${Date.now()}`,
      camera: {
        audioConfig: {
          enableAudio: true,
        },
        videoConfig: {
          enableVideo: callType === 'video',
        },
      },
    });

  console.log('✅ Local stream created:', localStream);
    return localStream;
  } catch (error) {
  console.error('Failed to create local stream:', error);
    throw error;
  }
};

export const joinRoom = async (roomId, stream) => {
  if (!zegoEngine) {
    throw new Error('Zego engine not initialized');
  }

  try {
    currentRoomId = roomId;
    await zegoEngine.loginRoom(roomId, stream, {
      userUpdateInterval: 1000,
      streamUpdateInterval: 1000,
    });
  console.log('✅ Joined room:', roomId);
  } catch (error) {
  console.error('Failed to join room:', error);
    throw error;
  }
};

export const startPublishing = async (roomId, streamId) => {
  if (!zegoEngine) {
    throw new Error('Zego engine not initialized');
  }

  try {
    await zegoEngine.startPublishing(roomId, {
      streamID: streamId,
    });
  console.log('✅ Started publishing to room:', roomId);
  } catch (error) {
  console.error('Failed to start publishing:', error);
    throw error;
  }
};

export const stopPublishing = async () => {
  if (!zegoEngine) return;

  try {
    await zegoEngine.stopPublishing();
  console.log('✅ Stopped publishing');
  } catch (error) {
  console.error('Failed to stop publishing:', error);
  }
};

export const leaveRoom = async () => {
  if (!zegoEngine || !currentRoomId) return;

  try {
    await zegoEngine.logoutRoom(currentRoomId);
  console.log('✅ Left room:', currentRoomId);
    currentRoomId = null;
  } catch (error) {
  console.error('Failed to leave room:', error);
  }
};

export const destroyStream = () => {
  if (!zegoEngine) return;

  try {
    if (localStream) {
      localStream.stop();
      localStream = null;
    }
    if (remoteStream) {
      remoteStream.stop();
      remoteStream = null;
    }
  console.log('✅ Stream destroyed');
  } catch (error) {
  console.error('Failed to destroy stream:', error);
  }
};

export const cleanupZego = async () => {
  await stopPublishing();
  await leaveRoom();
  destroyStream();
};
