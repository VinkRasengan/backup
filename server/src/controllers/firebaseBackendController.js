// Firebase-Backend Bridge Controller
// Firebase Auth for login/email verification + Backend for all features
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

class FirebaseBackendController {
  // Sync Firebase user to backend database
  async syncFirebaseUser(req, res, next) {
    try {
      const { idToken, firstName, lastName } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token (we'll use a simple decode for now)
      // In production, you'd verify with Firebase Admin SDK
      const decodedToken = this.decodeFirebaseToken(idToken);
      
      if (!decodedToken) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }

      // Check if user exists in backend database
      let user = await this.findUserByEmail(decodedToken.email);
      
      if (user) {
        // Update existing user
        await this.updateUserLastLogin(user.id);
        
        // Generate backend JWT token
        const backendToken = this.generateBackendToken(user.id, user.email);
        
        return res.json({
          message: 'User synced successfully',
          token: backendToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            isVerified: decodedToken.email_verified,
            lastLoginAt: new Date().toISOString()
          }
        });
      } else {
        // Create new user in backend database
        const userId = uuidv4();
        const userData = {
          id: userId,
          email: decodedToken.email,
          firstName: firstName || decodedToken.name?.split(' ')[0] || '',
          lastName: lastName || decodedToken.name?.split(' ')[1] || '',
          isVerified: decodedToken.email_verified,
          firebaseUid: decodedToken.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          stats: {
            linksChecked: 0,
            chatMessages: 0,
            joinedAt: new Date().toISOString()
          }
        };

        await this.saveUser(userData);

        // Generate backend JWT token
        const backendToken = this.generateBackendToken(userId, userData.email);

        return res.status(201).json({
          message: 'User created and synced successfully',
          token: backendToken,
          user: {
            id: userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            isVerified: userData.isVerified,
            createdAt: userData.createdAt
          }
        });
      }

    } catch (error) {
      console.error('Firebase sync error:', error);
      next(error);
    }
  }

  // Get current user (using backend JWT)
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await this.findUserById(userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified,
          bio: user.bio || '',
          avatarUrl: user.avatar_url || null,
          stats: user.stats || { linksChecked: 0, chatMessages: 0 },
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      next(error);
    }
  }

  // Update user profile (backend only)
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, bio } = req.body;

      const updateData = {
        first_name: firstName,
        last_name: lastName,
        bio,
        updated_at: new Date().toISOString()
      };

      await this.updateUser(userId, updateData);

      const updatedUser = await this.findUserById(userId);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          bio: updatedUser.bio,
          updatedAt: updatedUser.updated_at
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      next(error);
    }
  }

  // Increment user stats
  async incrementUserStats(userId, statType) {
    try {
      const user = await this.findUserById(userId);
      if (!user) return;

      const stats = user.stats || { linksChecked: 0, chatMessages: 0 };
      stats[statType] = (stats[statType] || 0) + 1;

      await this.updateUser(userId, {
        stats: JSON.stringify(stats),
        updated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Increment stats error:', error);
    }
  }

  // Simple Firebase token decoder (for demo - use Firebase Admin SDK in production)
  decodeFirebaseToken(idToken) {
    try {
      // This is a simplified decoder for demo purposes
      // In production, use Firebase Admin SDK to verify the token
      const parts = idToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Basic validation
      if (!payload.email || !payload.uid) return null;
      
      return {
        uid: payload.uid,
        email: payload.email,
        email_verified: payload.email_verified || false,
        name: payload.name || '',
        exp: payload.exp
      };
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // Generate backend JWT token
  generateBackendToken(userId, email) {
    return jwt.sign(
      { userId, email, authType: 'firebase-backend' },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  // Database operations with fallbacks
  async findUserByEmail(email) {
    if (database.isConnected) {
      try {
        const result = await database.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Database error in findUserByEmail:', error);
        return this.findUserByEmailInMemory(email);
      }
    } else {
      return this.findUserByEmailInMemory(email);
    }
  }

  async findUserById(id) {
    if (database.isConnected) {
      try {
        const result = await database.query(
          'SELECT * FROM users WHERE id = $1',
          [id]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Database error in findUserById:', error);
        return this.findUserByIdInMemory(id);
      }
    } else {
      return this.findUserByIdInMemory(id);
    }
  }

  async saveUser(userData) {
    if (database.isConnected) {
      try {
        await database.query(
          `INSERT INTO users (id, email, first_name, last_name, is_verified, firebase_uid, created_at, updated_at, last_login_at, stats)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userData.id,
            userData.email,
            userData.firstName,
            userData.lastName,
            userData.isVerified,
            userData.firebaseUid,
            userData.createdAt,
            userData.updatedAt,
            userData.lastLoginAt,
            JSON.stringify(userData.stats)
          ]
        );
      } catch (error) {
        console.error('Database error in saveUser:', error);
        this.saveUserInMemory(userData);
      }
    } else {
      this.saveUserInMemory(userData);
    }
  }

  async updateUser(id, updateData) {
    if (database.isConnected) {
      try {
        const setClause = Object.keys(updateData)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        const values = [id, ...Object.values(updateData)];
        
        await database.query(
          `UPDATE users SET ${setClause} WHERE id = $1`,
          values
        );
      } catch (error) {
        console.error('Database error in updateUser:', error);
        this.updateUserInMemory(id, updateData);
      }
    } else {
      this.updateUserInMemory(id, updateData);
    }
  }

  async updateUserLastLogin(id) {
    await this.updateUser(id, { last_login_at: new Date().toISOString() });
  }

  // In-memory storage fallbacks
  findUserByEmailInMemory(email) {
    const users = global.inMemoryDB?.users || new Map();
    return Array.from(users.values()).find(user => user.email === email) || null;
  }

  findUserByIdInMemory(id) {
    const users = global.inMemoryDB?.users || new Map();
    return users.get(id) || null;
  }

  saveUserInMemory(userData) {
    global.inMemoryDB = global.inMemoryDB || { users: new Map() };
    global.inMemoryDB.users.set(userData.id, userData);
  }

  updateUserInMemory(id, updateData) {
    global.inMemoryDB = global.inMemoryDB || { users: new Map() };
    const user = global.inMemoryDB.users.get(id);
    if (user) {
      Object.assign(user, updateData);
      global.inMemoryDB.users.set(id, user);
    }
  }
}

module.exports = new FirebaseBackendController();
