import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PromptsPage from './pages/PromptsPage';
import CreatePrompt from './pages/CreatePrompt';
import MyPrompts from './pages/MyPrompts';
import AdminPanel from './pages/AdminPanelEnhanced';
import UserProfile from './pages/UserProfile';
import PromptDetail from './pages/PromptDetail';
import Settings from './pages/Settings';
import Favorites from './pages/Favorites';
import Forums from './pages/Forums';
import AIToolsPage from './pages/AIToolsPage';
import EditPrompt from './pages/EditPrompt';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import CreateBlogPost from './pages/CreateBlogPost';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import VerifyEmailPending from './pages/VerifyEmailPending';
import ConfirmEmail from './pages/ConfirmEmail';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen" style={{ background: 'var(--void)', color: 'var(--stone)' }}>
          <Header />
          <EmailVerificationBanner />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/prompts" element={<PromptsPage />} />
              <Route path="/projects" element={<Navigate to="/" replace />} />
<Route path="/communities" element={<Navigate to="/forums" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create" element={<CreatePrompt />} />
              <Route path="/edit/:id" element={<EditPrompt />} />
              <Route path="/my-prompts" element={<MyPrompts />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/profile/:username" element={<UserProfile />} />
              <Route path="/prompt/:id" element={<PromptDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/forums" element={<Forums />} />
              <Route path="/tools" element={<AIToolsPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/new" element={<CreateBlogPost />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/verify-pending" element={<VerifyEmailPending />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
            </Routes>
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1C1C20',
                color: '#F2EDE4',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.10)',
                fontSize: '13px',
                fontWeight: '500',
                padding: '10px 16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#E8B84B',
                  secondary: '#0C0C0E',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#F87171',
                  secondary: '#0C0C0E',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
