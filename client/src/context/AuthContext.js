import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
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

  // Token refresh mechanism
  const refreshToken = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken(true); // Force refresh
        localStorage.setItem('token', token);
        console.log('🔄 Token refreshed successfully');
        return token;
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // If token refresh fails, sign out user
      await signOut(auth);
      throw error;
    }
  };

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

        // Store Firebase ID token with refresh mechanism
        try {
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));

          // Set up token refresh timer (refresh every 50 minutes)
          const refreshInterval = setInterval(async () => {
            try {
              await refreshToken();
            } catch (error) {
              console.error('Scheduled token refresh failed:', error);
              clearInterval(refreshInterval);
            }
          }, 50 * 60 * 1000); // 50 minutes

          // Store interval ID for cleanup
          localStorage.setItem('tokenRefreshInterval', refreshInterval.toString());
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear token refresh interval
        const intervalId = localStorage.getItem('tokenRefreshInterval');
        if (intervalId) {
          clearInterval(parseInt(intervalId));
          localStorage.removeItem('tokenRefreshInterval');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with Firebase Auth...');
      console.log('Auth instance:', auth);
      console.log('Firebase config:', auth.app.options);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let user = userCredential.user;

      // Force reload user to get latest emailVerified status
      await user.reload();
      user = auth.currentUser; // Get fresh user object after reload

      console.log('Login attempt - User:', user.email, 'Email verified:', user.emailVerified);

      // Check if email is verified BEFORE allowing login
      if (!user.emailVerified) {
        console.log('Email not verified, signing out user');
        // Sign out the user immediately
        await signOut(auth);
        toast.error('Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư của bạn.');
        return {
          success: false,
          error: 'Email chưa được xác minh',
          requiresVerification: true
        };
      }

      console.log('Email verified, proceeding with login');

      // Set user data only if email is verified
      const userData = {
        id: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };

      // Now that user is verified and logging in, save to Firestore if not exists
      try {
        const { doc, setDoc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Create user data in Firestore for first time login after verification
          const firestoreUserData = {
            email: user.email,
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ')[1] || '',
            displayName: user.displayName,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            profile: {
              bio: '',
              avatar: null
            },
            stats: {
              linksChecked: 0,
              joinedAt: new Date().toISOString()
            }
          };

          await setDoc(userDocRef, firestoreUserData);
          console.log('User data saved to Firestore on first login after verification');
        }
      } catch (firestoreError) {
        console.error('Failed to save user data to Firestore:', firestoreError);
        // Continue with login even if Firestore fails
      }

      // Sync with backend using Firebase ID token
      try {
        const idToken = await user.getIdToken();
        console.log('Syncing login with backend...');

        const backendResponse = await authAPI.syncLogin(idToken);
        console.log('Backend sync successful:', backendResponse);
      } catch (backendError) {
        console.error('Backend sync failed (continuing with login):', backendError);
        // Continue with login even if backend sync fails
      }

      setUser(userData);
      toast.success('Đăng nhập thành công!');

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
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        toast.warning('Tài khoản đã được tạo nhưng không thể gửi email xác minh. Bạn có thể yêu cầu gửi lại sau khi đăng nhập.');
      }

      // Important: Sign out the user so they must verify email before logging in
      // DO NOT save to Firestore yet - only save after email verification
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
      console.log('Starting email verification with action code:', actionCode);

      // Firebase Auth handles email verification with action codes
      const { applyActionCode, checkActionCode } = await import('firebase/auth');

      // First check the action code to get info
      try {
        const actionCodeInfo = await checkActionCode(auth, actionCode);
        console.log('Action code info:', actionCodeInfo);
      } catch (checkError) {
        console.log('Action code check failed:', checkError);
        // Continue anyway, applyActionCode will give us the real error
      }

      // Apply the action code to verify email
      await applyActionCode(auth, actionCode);
      console.log('Email verification applied successfully');

      toast.success('Email xác minh thành công! Bạn có thể đăng nhập ngay bây giờ.');
      return { success: true };

    } catch (error) {
      console.error('Email verification error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      let message;
      if (error.code === 'auth/expired-action-code') {
        message = 'Link xác minh đã hết hạn. Vui lòng yêu cầu link mới.';
      } else if (error.code === 'auth/invalid-action-code') {
        message = 'Link xác minh không hợp lệ. Vui lòng kiểm tra email để lấy link đúng.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Tài khoản này đã bị vô hiệu hóa.';
      } else {
        message = error.message || 'Xác minh email thất bại';
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
      await firebaseSendPasswordResetEmail(auth, email);
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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Create credential for reauthentication
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

      // Reauthenticate user
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      toast.success('Mật khẩu đã được thay đổi thành công!');
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      let message;

      switch (error.code) {
        case 'auth/wrong-password':
          message = 'Mật khẩu hiện tại không chính xác.';
          break;
        case 'auth/weak-password':
          message = 'Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
          break;
        case 'auth/requires-recent-login':
          message = 'Vui lòng đăng nhập lại để thay đổi mật khẩu.';
          break;
        case 'auth/too-many-requests':
          message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
          break;
        case 'auth/network-request-failed':
          message = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
          break;
        default:
          message = error.message || 'Không thể thay đổi mật khẩu. Vui lòng thử lại.';
      }

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
    updateProfile,
    changePassword,
    sendPasswordResetEmail: forgotPassword, // Alias for consistency
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
