import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { initializeSocket, disconnectSocket } from '../config/socket';

const SocketContext = createContext(null);

export const useSocket = () => {
 const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
 return context;
};

export const SocketProvider= ({ children, supabaseUserId }) => {
 const { user, isLoaded } = useUser();
 const [socket, setSocket] = useState(null);
 const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoaded && user && supabaseUserId) {
     console.log('🔌 Initializing socket for user:', supabaseUserId);
     const socketInstance = initializeSocket(supabaseUserId);
     setSocket(socketInstance);

      socketInstance.on('connect', () => {
       console.log('✅ Socket connected!');
       setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
       console.log('❌ Socket disconnected');
       setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
       console.error('❌ Socket connection error:', error);
      });

      return () => {
       console.log('🧹 Cleaning up socket');
        disconnectSocket();
       setSocket(null);
       setIsConnected(false);
      };
    } else if (isLoaded && !user) {
     console.log('👤 No user logged in, skipping socket init');
      disconnectSocket();
     setSocket(null);
     setIsConnected(false);
    }
  }, [user, isLoaded, supabaseUserId]);

 return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
