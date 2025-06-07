#!/usr/bin/env node

/**
 * Render Database Setup Script
 * Initializes PostgreSQL database with required tables
 */

const { Pool } = require('pg');

async function setupDatabase() {
  console.log('🚀 Setting up FactCheck Database on Render...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Please set DATABASE_URL in Render dashboard');
    process.exit(1);
  }

  console.log('📍 Connecting to database...');
  console.log('URL:', databaseUrl.replace(/:[^:@]*@/, ':***@'));

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Create tables
    console.log('📋 Creating database tables...');
    
    const createTablesSQL = `
      -- Users table (supports both Firebase and pure backend auth)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        firebase_uid VARCHAR(255) UNIQUE,
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

      -- Links table for URL checking
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        title VARCHAR(500),
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('safe', 'unsafe', 'suspicious', 'pending')),
        scan_results JSONB DEFAULT '{}'::jsonb,
        submitted_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Votes table for community voting
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('safe', 'unsafe', 'suspicious')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(link_id, user_id)
      );

      -- Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Chat conversations
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Chat messages
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'assistant')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reports table for admin
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
      CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
      CREATE INDEX IF NOT EXISTS idx_votes_link_id ON votes(link_id);
      CREATE INDEX IF NOT EXISTS idx_comments_link_id ON comments(link_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
    `;

    await client.query(createTablesSQL);
    console.log('✅ Database tables created successfully');

    // Insert sample data
    console.log('📝 Inserting sample community posts...');
    
    const sampleDataSQL = `
      INSERT INTO links (url, title, description, status, scan_results) VALUES
      ('https://example-safe-site.com', 'Example Safe Website', 'A verified safe website for testing', 'safe', '{"virusTotal": {"positives": 0, "total": 70}}'),
      ('https://suspicious-site.example', 'Suspicious Website', 'This site has some red flags', 'suspicious', '{"virusTotal": {"positives": 2, "total": 70}}'),
      ('https://known-scam.example', 'Known Scam Site', 'Confirmed fraudulent website', 'unsafe', '{"virusTotal": {"positives": 15, "total": 70}}'),
      ('https://news-site.example', 'Legitimate News Site', 'Trusted news source', 'safe', '{"virusTotal": {"positives": 0, "total": 70}}'),
      ('https://shopping-site.example', 'E-commerce Platform', 'Popular shopping website', 'safe', '{"virusTotal": {"positives": 0, "total": 70}}')
      ON CONFLICT (url) DO NOTHING;
    `;

    await client.query(sampleDataSQL);
    console.log('✅ Sample data inserted');

    client.release();
    await pool.end();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('- Tables: users, links, votes, comments, conversations, chat_messages, reports');
    console.log('- Sample data: 5 community posts');
    console.log('- Indexes: Created for performance');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
