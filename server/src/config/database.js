// PostgreSQL Database Configuration with Sequelize
const { Sequelize } = require('sequelize');
const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
    this.sequelize = null;
    this.isConnected = false;
    this.initializePool();
    this.initializeSequelize();
  }

  initializePool() {
    try {
      // Use DATABASE_URL from Render or construct from individual env vars
      const connectionString = process.env.DATABASE_URL || this.constructConnectionString();
      
      if (!connectionString) {
        console.warn('⚠️ No database configuration found, using in-memory storage');
        this.useInMemoryStorage();
        return;
      }

      this.pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 20000, // Increased to 20 seconds for Render
        acquireTimeoutMillis: 60000,    // 60 seconds to acquire connection
        createTimeoutMillis: 30000,     // 30 seconds to create connection
      });

      this.pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
        this.useInMemoryStorage();
      });

      console.log('✅ PostgreSQL pool initialized');
      this.testConnection();

    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL pool:', error.message);
      this.useInMemoryStorage();
    }
  }

  constructConnectionString() {
    const {
      DB_HOST = 'localhost',
      DB_PORT = 5432,
      DB_NAME = 'factcheck',
      DB_USER = 'factcheck_user',
      DB_PASSWORD
    } = process.env;

    if (!DB_PASSWORD) {
      return null;
    }

    return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }

  initializeSequelize() {
    try {
      const connectionString = process.env.DATABASE_URL || this.constructConnectionString();

      if (!connectionString) {
        console.warn('⚠️ No database configuration for Sequelize');
        this.sequelize = null;
        return;
      }

      this.sequelize = new Sequelize(connectionString, {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 60000,  // Increased to 60 seconds
          idle: 10000
        },
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          connectTimeout: 60000  // 60 seconds connection timeout
        },
        retry: {
          match: [
            /ConnectionError/,
            /ConnectionRefusedError/,
            /ConnectionTimedOutError/,
            /TimeoutError/,
            /SequelizeConnectionError/
          ],
          max: 3
        }
      });

      console.log('✅ Sequelize initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Sequelize:', error.message);
      this.sequelize = null;
    }
  }

  async testConnection() {
    try {
      // Test raw pool connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Test Sequelize connection
      if (this.sequelize) {
        await this.sequelize.authenticate();
        console.log('✅ Sequelize connection successful');
      }

      this.isConnected = true;
      console.log('✅ PostgreSQL connection successful');
      await this.createTables();
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      this.useInMemoryStorage();
    }
  }

  useInMemoryStorage() {
    console.log('🔄 Falling back to in-memory storage');
    this.isConnected = false;
    this.pool = null;
    
    // Initialize in-memory storage
    global.inMemoryDB = global.inMemoryDB || {
      users: new Map(),
      conversations: new Map(),
      messages: new Map(),
      links: new Map(),
      votes: new Map(),
      comments: new Map(),
      reports: new Map()
    };
  }

  async createTables() {
    if (!this.isConnected) return;

    const createTablesSQL = `
      -- Users table (supports both Firebase and pure backend auth)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255), -- NULL for Firebase users
        firebase_uid VARCHAR(255) UNIQUE, -- Firebase UID for Firebase users
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        display_name VARCHAR(200),
        is_verified BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        bio TEXT,
        auth_provider VARCHAR(20) DEFAULT 'backend' CHECK (auth_provider IN ('firebase', 'backend')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP,
        stats JSONB DEFAULT '{"linksChecked": 0, "chatMessages": 0}'::jsonb
      );

      -- Conversations table
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        message_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message TEXT
      );

      -- Chat messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Links table
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        title VARCHAR(500),
        description TEXT,
        security_score INTEGER,
        is_safe BOOLEAN,
        threats JSONB,
        analysis_result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Votes table
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('safe', 'unsafe', 'suspicious')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, link_id)
      );

      -- Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reports table
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('spam', 'misinformation', 'inappropriate', 'fake', 'other')),
        reason VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
      CREATE INDEX IF NOT EXISTS idx_votes_link_id ON votes(link_id);
      CREATE INDEX IF NOT EXISTS idx_comments_link_id ON comments(link_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    `;

    try {
      await this.pool.query(createTablesSQL);
      console.log('✅ Database tables created/verified');
    } catch (error) {
      console.error('❌ Failed to create tables:', error.message);
    }
  }

  async query(text, params) {
    if (!this.isConnected) {
      throw new Error('Database not connected. Using in-memory storage.');
    }

    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return res;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      throw error;
    }
  }

  async getClient() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('✅ Sequelize connection closed');
    }
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database pool closed');
    }
  }

  getSequelize() {
    return this.sequelize;
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'disconnected',
        type: 'in-memory',
        message: 'Using in-memory storage'
      };
    }

    try {
      const result = await this.query('SELECT NOW() as current_time');
      return {
        status: 'connected',
        type: 'postgresql',
        currentTime: result.rows[0].current_time,
        message: 'PostgreSQL connection healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        type: 'postgresql',
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new Database();
