// Hybrid Authentication Controller
// Supports both Firebase and PostgreSQL backends
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Try to load Firebase, fallback to PostgreSQL
let useFirebase = false;
let db, collections, admin;

try {
  const firebaseConfig = require('../config/firebase-config');
  admin = require('firebase-admin');

  // Initialize Firebase if not already done
  db = firebaseConfig.getDatabase();

  // Collections constants
  collections = {
    USERS: 'users',
    CONVERSATIONS: 'conversations',
    CHAT_MESSAGES: 'chat_messages',
    LINKS: 'links',
    VOTES: 'votes',
    COMMENTS: 'comments',
    REPORTS: 'reports'
  };

  useFirebase = true;
  console.log('✅ Hybrid Auth: Using Firebase backend');
} catch (error) {
  console.warn('⚠️ Hybrid Auth: Firebase not available, using PostgreSQL backend');
  useFirebase = false;
  // PostgreSQL setup will be added later
}

class HybridAuthController {
  // Register user
  async register(req, res, next) {
    try {
      if (useFirebase) {
        return await this.registerFirebase(req, res, next);
      } else {
        return await this.registerPostgreSQL(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      if (useFirebase) {
        return await this.loginFirebase(req, res, next);
      } else {
        return await this.loginPostgreSQL(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  // Firebase Registration
  async registerFirebase(req, res, next) {
    const { idToken, firstName, lastName } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if user already exists
    const userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();

    if (userDoc.exists) {
      return res.status(400).json({
        error: 'User already registered',
        code: 'USER_EXISTS'
      });
    }

    // Create user data
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
        chatMessages: 0,
        joinedAt: new Date().toISOString()
      }
    };

    await db.collection(collections.USERS).doc(decodedToken.uid).set(userData);

    res.status(201).json({
      message: 'User registered successfully',
      userId: decodedToken.uid,
      user: userData
    });
  }

  // PostgreSQL Registration
  async registerPostgreSQL(req, res, next) {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    // Create user data (in-memory for now, will be PostgreSQL later)
    const userData = {
      id: userId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        bio: '',
        avatar: null
      },
      stats: {
        linksChecked: 0,
        chatMessages: 0,
        joinedAt: new Date().toISOString()
      }
    };

    // TODO: Save to PostgreSQL
    // For now, store in memory (will be replaced with DB)
    global.users = global.users || new Map();
    global.users.set(email, userData);

    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        isVerified: false
      }
    });
  }

  // Firebase Login
  async loginFirebase(req, res, next) {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token required',
        code: 'TOKEN_MISSING'
      });
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get or create user data
    let userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();
    let userData;

    if (userDoc.exists) {
      userData = userDoc.data();
      await userDoc.ref.update({
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // Auto-create user on first login
      userData = {
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ')[1] || '',
        isVerified: decodedToken.email_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profile: { bio: '', avatar: null },
        stats: { linksChecked: 0, chatMessages: 0, joinedAt: new Date().toISOString() }
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
  }

  // PostgreSQL Login
  async loginPostgreSQL(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // TODO: Get from PostgreSQL
    // For now, get from memory
    global.users = global.users || new Map();
    const userData = global.users.get(email);

    if (!userData) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isVerified: userData.isVerified
      }
    });
  }

  // Get current user
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.userId;

      if (useFirebase) {
        const userDoc = await db.collection(collections.USERS).doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        res.json({
          user: {
            id: userId,
            ...userDoc.data()
          }
        });
      } else {
        // TODO: Get from PostgreSQL
        global.users = global.users || new Map();
        const userData = Array.from(global.users.values()).find(u => u.id === userId);

        if (!userData) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        const { password, ...userWithoutPassword } = userData;
        res.json({ user: userWithoutPassword });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HybridAuthController();
