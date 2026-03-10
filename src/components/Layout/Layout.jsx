import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from '@/pages/ChatPage.jsx';
import VideoCallPage from '@/pages/VideoCallPage.jsx';
import FAQPage from '@/pages/FAQPage.jsx';
import { SocketProvider } from '@/contexts/SocketContext.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import './Layout.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
 return (
    <Routes>
      <Route path="/" element={
        <Layout>
          <ChatPage />
        </Layout>
      } />
      <Route path="/call" element={
        <Layout>
          <VideoCallPage />
        </Layout>
      } />
      <Route path="/faq" element={
        <Layout>
          <FAQPage />
        </Layout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div style={{ padding: '20px', color: '#ff3b30' }}>
        <h2>Configuration Required</h2>
        <p>Please set up your Clerk credentials in the .env file:</p>
        <code>VITE_CLERK_PUBLISHABLE_KEY=your_key_here</code>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Router>
        <AuthProvider>
          <>
            <SignedIn>
              <AppRoutes />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        </AuthProvider>
      </Router>
    </ClerkProvider>
  );
};

export default App;
