import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/tab-specific.css';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { initAccessibility } from './utils/accessibility';
import { globalCleanup } from './utils/requestOptimizer';
import './utils/scrollDebugger';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ModernRegisterPage from './pages/ModernRegisterPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CheckLinkPage from './pages/CheckLinkPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import CommunityPage from './pages/CommunityPage';

import SubmitArticlePage from './pages/SubmitArticlePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import EmailVerificationRequiredPage from './pages/EmailVerificationRequiredPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import SecurityPage from './pages/SecurityPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PremiumPage from './pages/PremiumPage';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';
import AchievementsPage from './pages/AchievementsPage';
import HelpPage from './pages/HelpPage';
import TestIntegrationPage from './pages/TestIntegrationPage';
import FirestoreTestPanel from './components/admin/FirestoreTestPanel';
import TestSubmitAPI from './pages/TestSubmitAPI';

// Components - organized imports
import ProtectedRoute from './components/auth/ProtectedRoute';
import EmailVerifiedRoute from './components/auth/EmailVerifiedRoute';
import { LoadingSpinner, ErrorBoundary } from './components/common';
import NavigationLayout from './components/navigation/NavigationLayout';
import GlobalAnimationProvider from './components/animations/GlobalAnimationProvider';

function App() {
  const { user, loading } = useAuth();

  // Initialize accessibility features and cleanup
  useEffect(() => {
    initAccessibility();
    
    // Cleanup function to prevent request overload
    return () => {
      globalCleanup();
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GlobalAnimationProvider>
          <NavigationLayout>
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
              />              <Route path="/registration-success" element={<RegistrationSuccessPage />} />
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
          />          <Route
            path="/community"
            element={<CommunityPage />}
          />
          <Route
            path="/community/feed"
            element={<Navigate to="/community?tab=news" replace />}
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
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* New feature pages */}
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <AchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/help" element={<HelpPage />} />

          {/* Admin/Test Routes */}
          <Route
            path="/admin/firestore-test"
            element={
              <ProtectedRoute>
                <FirestoreTestPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-integration"
            element={<TestIntegrationPage />}
          />
          <Route
            path="/test-submit-api"
            element={
              <ProtectedRoute>
                <TestSubmitAPI />
              </ProtectedRoute>
            }
          />
          

          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
          </NavigationLayout>
        </GlobalAnimationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
