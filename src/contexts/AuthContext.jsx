import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { syncUserToMongoDB, updateUserOnlineStatus } from '@/services/mongodb-client';

export const AuthContext = createContext(null);

export const useAuth = () => {
 const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
 return context;
};

// Cache to prevent duplicate sync requests
let lastSyncTime = 0;
let lastSyncedUserId = null;
const SYNC_COOLDOWN = 30000; // 30 seconds cooldown between syncs

export const AuthProvider = ({ children }) => {
 const { user, isLoaded: isUserLoaded } = useUser();
 const { signOut: clerkSignOut } = useClerkAuth();
 const [supabaseUserId, setSupabaseUserId] = useState(null); // Keeping for compatibility
 const [isSynced, setIsSynced] = useState(false);
 const [syncInProgress, setSyncInProgress] = useState(false);

  // Sync user to MongoDB when they log in (with rate limiting)
  useEffect(() => {
    if (user && isUserLoaded && !syncInProgress) {
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
      
      // Skip sync if we synced this user recently
      if (user.id === lastSyncedUserId && timeSinceLastSync < SYNC_COOLDOWN) {
     console.log('⏭️ Skipping redundant sync (cooldown active)');
        setIsSynced(true);
        return;
      }

      // Force cooldown wait if syncing different user too quickly
      if (timeSinceLastSync < 5000) {
     console.log('⏳ Rate limit protection, waiting...');
        setTimeout(() => {
         syncUserAndSetState(user);
        }, 5000 - timeSinceLastSync);
        return;
      }

     syncUserAndSetState(user);
    } else if (!user && isUserLoaded) {
     setIsSynced(false);
      lastSyncedUserId = null;
      lastSyncTime = 0;
    }
  }, [user, isUserLoaded, syncInProgress]);

const syncUserAndSetState = async (user) => {
    if (syncInProgress) return;
    
  try {
      setSyncInProgress(true);
   console.log('🔄 User loaded, syncing to MongoDB...', user.id);
      
    const result = await syncUserToMongoDB(user);
        if (result.success) {
        setSupabaseUserId(result.userId); // Using same state for compatibility
        setIsSynced(true);
        lastSyncTime = Date.now();
        lastSyncedUserId = user.id;
     console.log('✅ User synced to MongoDB successfully');
        }
    } catch (error) {
   console.error('❌ Failed to sync user:', error);
      // Don't retry on error, wait for next mount
      setIsSynced(false);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Mark user as online (debounced)
  useEffect(() => {
    if (user && isSynced) {
    const timeoutId = setTimeout(() => {
       updateUserOnlineStatus(user.id, true).catch(console.error);
      }, 1000); // Wait 1 second before marking online
      
      // Cleanup: mark as offline on unmount/logout
      return () => {
        clearTimeout(timeoutId);
        if (user) {
          updateUserOnlineStatus(user.id, false).catch(console.error);
        }
      };
    }
  }, [user, isSynced]);

const signOut = async () => {
  try {
      if (user) {
        await updateUserOnlineStatus(user.id, false);
      }
      await clerkSignOut();
      // Reset sync cache on logout
      lastSyncTime = 0;
      lastSyncedUserId = null;
    } catch (error) {
   console.error('Error signing out:', error);
    }
  };

const value = {
   user,
    supabaseUserId, // Same state name for compatibility
    isSynced,
    signOut,
    isLoaded: isUserLoaded && isSynced
  };

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
