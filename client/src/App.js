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
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmailVerificationRequiredPage from './pages/EmailVerificationRequiredPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import EmailVerifiedRoute from './components/EmailVerifiedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ChatBot from './components/ChatBot/ChatBot';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <ModernNavigation />
        <main>
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

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* ChatBot - hiển thị trên tất cả các trang */}
      <ChatBot />
      </div>
    </ThemeProvider>
  );
}

export default App;
