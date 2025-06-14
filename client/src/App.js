import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/tab-specific.css';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { initAccessibility } from './utils/accessibility';

// Pages
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
import MySubmissionsPage from './pages/MySubmissionsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmailVerificationRequiredPage from './pages/EmailVerificationRequiredPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChatTestPage from './pages/ChatTestPage';

// Components - organized imports
import ProtectedRoute from './components/auth/ProtectedRoute';
import EmailVerifiedRoute from './components/auth/EmailVerifiedRoute';
import { LoadingSpinner, ErrorBoundary } from './components/common';
import AppLayout from './components/layout/AppLayout';
import GSAPDemo from './components/GSAPDemo';

function App() {
  const { user, loading } = useAuth();

  // Initialize accessibility features
  useEffect(() => {
    initAccessibility();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppLayout>
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
            path="/my-submissions"
            element={
              <ProtectedRoute>
                <EmailVerifiedRoute>
                  <MySubmissionsPage />
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

          <Route
            path="/chat-widget-test"
            element={<ChatTestPage />}
          />

          <Route
            path="/gsap-demo"
            element={<GSAPDemo />}
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </AppLayout>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
