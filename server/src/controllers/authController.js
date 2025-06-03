const { auth, db, collections } = require('../config/firebase-emulator');

class AuthController {
  // Sync user data to Firestore after Firebase Auth registration
  async register(req, res, next) {
    try {
      const { idToken, firstName, lastName } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);

      // Check if user already exists in Firestore
      const userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();

      if (userDoc.exists) {
        return res.status(400).json({
          error: 'User already registered',
          code: 'USER_EXISTS'
        });
      }

      // Create user data in Firestore
      const userData = {
        email: decodedToken.email,
        firstName: firstName || decodedToken.name?.split(' ')[0] || '',
        lastName: lastName || decodedToken.name?.split(' ')[1] || '',
        isVerified: decodedToken.email_verified,
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

      // Save user to Firestore with Firebase UID as document ID
      await db.collection(collections.USERS).doc(decodedToken.uid).set(userData);

      res.status(201).json({
        message: 'User data synced successfully',
        userId: decodedToken.uid,
        user: userData
      });

    } catch (error) {
      console.error('Register sync error:', error);
      if (error.code && error.code.startsWith('auth/')) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }
      next(error);
    }
  }

  // Login endpoint - Firebase Auth handles login on frontend
  // This endpoint is for syncing user data after Firebase Auth login
  async login(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);

      // Get or create user data in Firestore
      let userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();
      let userData;

      if (userDoc.exists) {
        userData = userDoc.data();
        // Update last login
        await userDoc.ref.update({
          lastLoginAt: new Date().toISOString()
        });
      } else {
        // Create user document if it doesn't exist (first time login)
        userData = {
          email: decodedToken.email,
          firstName: decodedToken.name?.split(' ')[0] || '',
          lastName: decodedToken.name?.split(' ')[1] || '',
          isVerified: decodedToken.email_verified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          profile: {
            bio: '',
            avatar: null
          },
          stats: {
            linksChecked: 0,
            joinedAt: new Date().toISOString()
          }
        };

        await db.collection(collections.USERS).doc(decodedToken.uid).set(userData);
      }

      res.json({
        message: 'Login successful',
        user: {
          id: decodedToken.uid,
          ...userData
        }
      });

    } catch (error) {
      console.error('Login sync error:', error);
      if (error.code?.startsWith('auth/')) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }
      next(error);
    }
  }

  // Email verification is handled by Firebase Auth
  async verifyEmail(req, res, next) {
    try {
      res.json({
        message: 'Email verification is handled by Firebase Auth. Please check your email and click the verification link.'
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend verification email
  async resendVerificationEmail(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);

      // Check if user already verified
      if (decodedToken.email_verified) {
        return res.status(400).json({
          error: 'Email is already verified',
          code: 'ALREADY_VERIFIED'
        });
      }

      // Note: Firebase Admin SDK doesn't have a direct method to resend verification emails
      // This would typically be handled on the frontend using Firebase Auth client SDK
      res.json({
        message: 'Verification email resend is handled by Firebase Auth client SDK. Please use the frontend resend functionality.',
        userId: decodedToken.uid
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      if (error.code?.startsWith('auth/')) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }
      next(error);
    }
  }

  // Password reset is handled by Firebase Auth
  async forgotPassword(req, res, next) {
    try {
      res.json({
        message: 'Password reset is handled by Firebase Auth. Please use the forgot password feature in the login form.'
      });
    } catch (error) {
      next(error);
    }
  }

  // Password reset is handled by Firebase Auth
  async resetPassword(req, res, next) {
    try {
      res.json({
        message: 'Password reset is handled by Firebase Auth. Please use the password reset link sent to your email.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
