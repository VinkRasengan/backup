import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/tab-specific.css';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { initAccessibility } from './utils/accessibility';
import { globalCleanup } from './utils/requestOptimizer';

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
import KnowledgeArticlePage from './pages/KnowledgeArticlePage';

// Components - organized imports
import ProtectedRoute from './components/auth/ProtectedRoute';
import EmailVerifiedRoute from './components/auth/EmailVerifiedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { LoadingSpinner, ErrorBoundary } from './components/common';
import NavigationLayout from './components/navigation/NavigationLayout';
import GlobalAnimationProvider from './components/animations/GlobalAnimationProvider';
import RoutingDebug from './components/debug/RoutingDebug';
import RoutingTestPanel from './components/debug/RoutingTestPanel';

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
  }

  return (
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
            />
            <Route path="/registration-success" element={<RegistrationSuccessPage />} />
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
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/firestore-test"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
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
            <Route path="/knowledge/:id" element={<KnowledgeArticlePage />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* New feature pages */}
            <Route
              path="/security"
              element={
                <ProtectedRoute>
                  <SecurityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/premium"
              element={
                <ProtectedRoute>
                  <PremiumPage />
                </ProtectedRoute>
              }
            />
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

            {/* Settings sub-routes */}
            <Route
              path="/settings/account"
              element={
                <ProtectedRoute>
                  <SettingsPage activeTab="account" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/security"
              element={
                <ProtectedRoute>
                  <SettingsPage activeTab="security" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute>
                  <SettingsPage activeTab="notifications" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/appearance"
              element={
                <ProtectedRoute>
                  <SettingsPage activeTab="appearance" />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </NavigationLayout>

          {/* Development routing debug */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <RoutingDebug />
              <RoutingTestPanel />
            </>
          )}
        </GlobalAnimationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
