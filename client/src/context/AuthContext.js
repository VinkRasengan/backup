import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const userData = {
          id: user.uid,
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ')[1] || '',
          displayName: user.displayName,
          emailVerified: user.emailVerified
        };
        setUser(userData);

        // Store Firebase ID token
        try {
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set user data
      const userData = {
        id: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };

      setUser(userData);

      // Check if email is verified and show appropriate message
      if (!user.emailVerified) {
        toast.warning('Login successful! Please verify your email address to access all features.');
      } else {
        toast.success('Login successful!');
      }

      return { success: true, data: userData };
    } catch (error) {
      console.error('Login error:', error);

      let message;

      // Handle Firebase Auth login errors
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.';
          break;
        case 'auth/wrong-password':
          message = 'Mật khẩu không chính xác. Vui lòng thử lại hoặc đặt lại mật khẩu.';
          break;
        case 'auth/invalid-email':
          message = 'Địa chỉ email không hợp lệ.';
          break;
        case 'auth/user-disabled':
          message = 'Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.';
          break;
        case 'auth/too-many-requests':
          message = 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ít phút hoặc đặt lại mật khẩu.';
          break;
        case 'auth/network-request-failed':
          message = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
          break;
        case 'auth/invalid-credential':
          message = 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra email và mật khẩu.';
          break;
        case 'auth/account-exists-with-different-credential':
          message = 'Tài khoản đã tồn tại với phương thức đăng nhập khác.';
          break;
        default:
          message = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      }

      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      console.log('User created:', user.uid, 'Email verified:', user.emailVerified);

      // Update profile with name
      await firebaseUpdateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Configure action code settings for email verification
      const actionCodeSettings = {
        url: window.location.origin + '/verify-email',
        handleCodeInApp: true
      };

      // Send email verification with custom settings
      try {
        await sendEmailVerification(user, actionCodeSettings);
        console.log('Verification email sent successfully');
        toast.success('Registration successful! Please check your email to verify your account before logging in.');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        toast.warning('Account created but verification email failed to send. You can request a new one after logging in.');
      }

      // Important: Sign out the user so they must verify email before logging in
      await signOut(auth);

      return { success: true, data: user, requiresVerification: true };
    } catch (error) {
      console.error('Registration error:', error);
      let message;

      // Handle Firebase Auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.';
          break;
        case 'auth/weak-password':
          message = 'Mật khẩu quá yếu. Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
          break;
        case 'auth/invalid-email':
          message = 'Địa chỉ email không hợp lệ.';
          break;
        case 'auth/password-does-not-meet-requirements':
          message = 'Mật khẩu không đáp ứng yêu cầu bảo mật. Cần có ít nhất 8 ký tự với chữ hoa, chữ thường, số và ký tự đặc biệt.';
          break;
        case 'auth/too-many-requests':
          message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Đăng ký bằng email/mật khẩu chưa được kích hoạt.';
          break;
        case 'auth/network-request-failed':
          message = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
          break;
        default:
          // Parse detailed error message from Firebase
          if (error.message && error.message.includes('Password should be at least')) {
            message = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
          } else if (error.message && error.message.includes('password')) {
            message = 'Mật khẩu không đáp ứng yêu cầu bảo mật. Vui lòng tạo mật khẩu mạnh hơn.';
          } else {
            message = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
          }
      }

      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      Cookies.remove('token');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const verifyEmail = async (actionCode) => {
    try {
      // Firebase Auth handles email verification with action codes
      const { applyActionCode } = await import('firebase/auth');
      await applyActionCode(auth, actionCode);

      // Reload user to get updated emailVerified status
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = {
          ...user,
          emailVerified: auth.currentUser.emailVerified
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      toast.success('Email verified successfully! You can now access all features.');
      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      let message;
      if (error.code === 'auth/expired-action-code') {
        message = 'Verification link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        message = 'Invalid verification link. Please check your email for the correct link.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      } else {
        message = error.message || 'Email verification failed';
      }
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      if (currentUser.emailVerified) {
        toast.info('Your email is already verified!');
        return { success: true, message: 'Email already verified' };
      }

      // Configure action code settings for email verification
      const actionCodeSettings = {
        url: window.location.origin + '/verify-email',
        handleCodeInApp: true
      };

      await sendEmailVerification(currentUser, actionCodeSettings);
      console.log('Verification email resent successfully');
      toast.success('Verification email sent! Please check your inbox.');
      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      let message;
      if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait before requesting another verification email.';
      } else {
        message = error.message || 'Failed to send verification email';
      }
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      let message;

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Không tìm thấy tài khoản với email này.';
          break;
        case 'auth/invalid-email':
          message = 'Địa chỉ email không hợp lệ.';
          break;
        case 'auth/too-many-requests':
          message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
          break;
        case 'auth/network-request-failed':
          message = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
          break;
        default:
          message = error.message || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.';
      }

      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      // For demo purposes, just show success message
      toast.success('Password reset successfully! You can now log in.');
      return { success: true };
    } catch (error) {
      const message = 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await firebaseUpdateProfile(currentUser, {
          displayName: `${profileData.firstName} ${profileData.lastName}`
        });

        // Update local user state
        const updatedUser = {
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          displayName: `${profileData.firstName} ${profileData.lastName}`
        };
        setUser(updatedUser);

        toast.success('Profile updated successfully');
        return { success: true, data: updatedUser };
      } else {
        throw new Error('No user logged in');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
