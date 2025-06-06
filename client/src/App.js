import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ModernNavigation from './components/ModernNavigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

import ModernRegisterPage from './pages/ModernRegisterPage';
import TestRegisterPage from './pages/TestRegisterPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CheckLinkPage from './pages/CheckLinkPage';
import ChatPage from './pages/ChatPage';
import ChatTest from './pages/ChatTest';
import AdminDashboard from './pages/AdminDashboard';
import CommunityFeedPage from './pages/CommunityFeedPage';
import SubmitArticlePage from './pages/SubmitArticlePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmailVerificationRequiredPage from './pages/EmailVerificationRequiredPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import EmailVerifiedRoute from './components/EmailVerifiedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ChatBot from './components/ChatBot/ChatBot';
import RedditLayout from './components/RedditLayout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <RedditLayout>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={<HomePage />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/dashboard" /> : <ModernRegisterPage />}
            />
            <Route
              path="/test-register"
              element={<TestRegisterPage />}
            />
            <Route path="/registration-success" element={<RegistrationSuccessPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/email-verification-required" element={<EmailVerificationRequiredPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/check"
            element={
              <EmailVerifiedRoute>
                <CheckLinkPage />
              </EmailVerifiedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <EmailVerifiedRoute>
                  <ChatPage />
                </EmailVerifiedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <EmailVerifiedRoute>
                  <CommunityFeedPage />
                </EmailVerifiedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <EmailVerifiedRoute>
                  <SubmitArticlePage />
                </EmailVerifiedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge"
            element={<KnowledgeBasePage />}
          />
          <Route
            path="/chat-test"
            element={<ChatTest />}
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* ChatBot - hiển thị trên tất cả các trang */}
        <ChatBot />
        </RedditLayout>
      </div>
    </ThemeProvider>
  );
}

export default App;
