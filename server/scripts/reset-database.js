#!/usr/bin/env node

/**
 * Database Reset Script
 * Fixes PostgreSQL ENUM conflicts and recreates tables
 */

const { Pool } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  if (!connectionString) {
    console.error('❌ No database configuration found');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // Drop all tables and types
    console.log('🗑️ Dropping existing tables and types...');
    await pool.query(`
      DROP TABLE IF EXISTS reports CASCADE;
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS votes CASCADE;
      DROP TABLE IF EXISTS links CASCADE;
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      -- Drop ENUM types
      DROP TYPE IF EXISTS enum_users_auth_provider CASCADE;
      DROP TYPE IF EXISTS enum_links_status CASCADE;
      DROP TYPE IF EXISTS enum_votes_vote_type CASCADE;
      DROP TYPE IF EXISTS enum_reports_status CASCADE;
    `);

    console.log('✅ Tables and types dropped successfully');

    // Recreate tables with correct structure
    console.log('🔨 Creating fresh tables...');
    await pool.query(`
      -- Users table (supports both Firebase and pure backend auth)
      CREATE TABLE users (
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
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Chat messages table
      CREATE TABLE chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT,
        message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'assistant', 'system')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb
      );

      -- Links table (for URL checking)
      CREATE TABLE links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        title VARCHAR(500),
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'safe', 'suspicious', 'malicious', 'error')),
        scan_results JSONB DEFAULT '{}'::jsonb,
        submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vote_count INTEGER DEFAULT 0,
        trust_score DECIMAL(3,2) DEFAULT 0.00
      );

      -- Votes table (community voting)
      CREATE TABLE votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('trust', 'distrust', 'report')),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(link_id, user_id)
      );

      -- Comments table
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reports table (for moderation)
      CREATE TABLE reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
      );

      -- Create indexes for better performance
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
      CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX idx_links_url ON links(url);
      CREATE INDEX idx_links_status ON links(status);
      CREATE INDEX idx_votes_link_id ON votes(link_id);
      CREATE INDEX idx_votes_user_id ON votes(user_id);
      CREATE INDEX idx_comments_link_id ON comments(link_id);
      CREATE INDEX idx_reports_status ON reports(status);
    `);

    console.log('✅ Fresh tables created successfully');

    // Insert sample data
    console.log('📝 Inserting sample data...');
    await pool.query(`
      -- Sample user
      INSERT INTO users (email, display_name, auth_provider, is_verified) 
      VALUES ('demo@example.com', 'Demo User', 'backend', true);

      -- Sample links for community
      INSERT INTO links (url, title, description, status, trust_score) VALUES
      ('https://google.com', 'Google Search', 'The world''s most popular search engine', 'safe', 0.95),
      ('https://github.com', 'GitHub', 'Code hosting platform for developers', 'safe', 0.92),
      ('https://stackoverflow.com', 'Stack Overflow', 'Q&A platform for programmers', 'safe', 0.88),
      ('https://example-phishing.com', 'Suspicious Site', 'Potentially malicious website', 'suspicious', 0.15),
      ('https://facebook.com', 'Facebook', 'Social networking platform', 'safe', 0.78);
    `);

    console.log('✅ Sample data inserted');
    console.log('🎉 Database reset completed successfully!');

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the reset
resetDatabase().catch(console.error);
