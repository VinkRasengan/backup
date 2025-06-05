// Pure Backend Authentication Controller (No Firebase)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

class PureAuthController {
  // Register new user
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_FIELDS'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long',
          code: 'WEAK_PASSWORD'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      // Create user data
      const userData = {
        id: userId,
        email,
        passwordHash,
        firstName: firstName || '',
        lastName: lastName || '',
        isVerified: false, // Email verification can be implemented later
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          linksChecked: 0,
          chatMessages: 0,
          joinedAt: new Date().toISOString()
        }
      };

      // Save user
      await this.saveUser(userData);

      // Generate JWT token
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: userId,
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isVerified: userData.isVerified,
          createdAt: userData.createdAt
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Find user
      const user = await this.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Update last login
      await this.updateUserLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          lastLoginAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  }

  // Get current user profile
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
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          bio: user.bio || '',
          avatarUrl: user.avatarUrl || null,
          stats: user.stats || { linksChecked: 0, chatMessages: 0 },
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, bio } = req.body;

      const updateData = {
        firstName,
        lastName,
        bio,
        updatedAt: new Date().toISOString()
      };

      await this.updateUser(userId, updateData);

      res.json({
        message: 'Profile updated successfully',
        user: await this.findUserById(userId)
      });

    } catch (error) {
      console.error('Update profile error:', error);
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required',
          code: 'MISSING_FIELDS'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long',
          code: 'WEAK_PASSWORD'
        });
      }

      // Get user
      const user = await this.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.updateUser(userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      });

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      next(error);
    }
  }

  // Database operations
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
          `INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified, created_at, updated_at, stats)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            userData.id,
            userData.email,
            userData.passwordHash,
            userData.firstName,
            userData.lastName,
            userData.isVerified,
            userData.createdAt,
            userData.updatedAt,
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
          .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
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
    await this.updateUser(id, { lastLoginAt: new Date().toISOString() });
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

  // Utility function
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = new PureAuthController();
