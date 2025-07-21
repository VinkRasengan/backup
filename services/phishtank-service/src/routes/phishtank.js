const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'PhishTank Service is working!',
    timestamp: new Date().toISOString()
  });
});

// Service info endpoint (for API versioning)
router.get('/info', (req, res) => {
  res.json({
    service: 'phishtank-service',
    version: '1.0.0',
    description: 'PhishTank Opensource Service using Public Data Feed',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    features: {
      phishingDetection: true,
      urlAnalysis: true,
      offlineDatabase: true,
      autoUpdate: true
    },
    dataSource: 'http://data.phishtank.com/data/online-valid.json'
  });
});

// Get database status
router.get('/status', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../../data/phishtank-database.json');
    const statsPath = path.join(__dirname, '../../data/database-stats.json');
    
    let stats = {
      exists: false,
      lastUpdated: null,
      totalEntries: 0,
      size: 0
    };
    
    if (await fs.pathExists(dbPath)) {
      const dbStats = await fs.stat(dbPath);
      stats.exists = true;
      stats.size = dbStats.size;
      stats.lastUpdated = dbStats.mtime;
      
      // Try to read stats file
      if (await fs.pathExists(statsPath)) {
        const savedStats = await fs.readJson(statsPath);
        stats = { ...stats, ...savedStats };
      }
    }
    
    res.json({
      success: true,
      database: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get database status',
      details: error.message
    });
  }
});

// Check URL against PhishTank database
router.post('/check-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        code: 'MISSING_URL'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        code: 'INVALID_URL'
      });
    }
    
    const dbPath = path.join(__dirname, '../../data/phishtank-database.json');
    
    if (!await fs.pathExists(dbPath)) {
      return res.status(503).json({
        success: false,
        error: 'PhishTank database not available',
        code: 'DATABASE_NOT_FOUND',
        message: 'Database is being downloaded. Please try again in a few minutes.'
      });
    }
    
    // Load database
    const database = await fs.readJson(dbPath);
    
    // Normalize URL for comparison
    const normalizedUrl = normalizeUrl(url);
    
    // Search for URL in database
    const phishEntry = database.find(entry => {
      const entryUrl = normalizeUrl(entry.url);
      return entryUrl === normalizedUrl || entryUrl.includes(normalizedUrl) || normalizedUrl.includes(entryUrl);
    });
    
    const isPhishing = !!phishEntry;
    
    const result = {
      url,
      isPhishing,
      safe: !isPhishing,
      source: 'PhishTank',
      checkedAt: new Date().toISOString()
    };
    
    if (phishEntry) {
      result.phishDetails = {
        phishId: phishEntry.phish_id,
        submissionTime: phishEntry.submission_time,
        verified: phishEntry.verified === 'yes',
        verificationTime: phishEntry.verification_time,
        onlineStatus: phishEntry.online === 'yes',
        target: phishEntry.target || 'Unknown'
      };
    }
    
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('URL check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check URL',
      code: 'CHECK_ERROR',
      details: error.message
    });
  }
});

// Bulk check URLs
router.post('/check-urls', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required',
        code: 'MISSING_URLS'
      });
    }
    
    if (urls.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 URLs allowed per bulk check',
        code: 'TOO_MANY_URLS'
      });
    }
    
    const dbPath = path.join(__dirname, '../../data/phishtank-database.json');
    
    if (!await fs.pathExists(dbPath)) {
      return res.status(503).json({
        success: false,
        error: 'PhishTank database not available',
        code: 'DATABASE_NOT_FOUND'
      });
    }
    
    // Load database
    const database = await fs.readJson(dbPath);
    
    // Check each URL
    const results = urls.map(url => {
      try {
        new URL(url); // Validate URL
        
        const normalizedUrl = normalizeUrl(url);
        const phishEntry = database.find(entry => {
          const entryUrl = normalizeUrl(entry.url);
          return entryUrl === normalizedUrl || entryUrl.includes(normalizedUrl) || normalizedUrl.includes(entryUrl);
        });
        
        const isPhishing = !!phishEntry;
        
        return {
          url,
          isPhishing,
          safe: !isPhishing,
          phishId: phishEntry?.phish_id || null,
          verified: phishEntry?.verified === 'yes' || false
        };
        
      } catch (urlError) {
        return {
          url,
          error: 'Invalid URL format',
          isPhishing: false,
          safe: false
        };
      }
    });
    
    const summary = {
      total: urls.length,
      phishing: results.filter(r => r.isPhishing).length,
      safe: results.filter(r => r.safe && !r.isPhishing).length,
      errors: results.filter(r => r.error).length
    };
    
    res.json({
      success: true,
      results,
      summary,
      checkedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Bulk check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check URLs',
      details: error.message
    });
  }
});

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../../data/phishtank-database.json');
    const statsPath = path.join(__dirname, '../../data/database-stats.json');
    
    if (!await fs.pathExists(dbPath)) {
      return res.status(404).json({
        success: false,
        error: 'Database not found'
      });
    }
    
    let stats = {};
    
    if (await fs.pathExists(statsPath)) {
      stats = await fs.readJson(statsPath);
    } else {
      // Generate stats from database
      const database = await fs.readJson(dbPath);
      stats = generateDatabaseStats(database);
      await fs.writeJson(statsPath, stats);
    }
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
});

// Helper function to normalize URLs
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove protocol, www, and trailing slash
    let normalized = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch (error) {
    return url.toLowerCase();
  }
}

// Helper function to generate database statistics
function generateDatabaseStats(database) {
  const stats = {
    totalEntries: database.length,
    verified: database.filter(entry => entry.verified === 'yes').length,
    online: database.filter(entry => entry.online === 'yes').length,
    targets: {},
    submissionDates: {}
  };
  
  // Count targets
  database.forEach(entry => {
    const target = entry.target || 'Unknown';
    stats.targets[target] = (stats.targets[target] || 0) + 1;
  });
  
  // Count by submission date
  database.forEach(entry => {
    if (entry.submission_time) {
      const date = entry.submission_time.split('T')[0];
      stats.submissionDates[date] = (stats.submissionDates[date] || 0) + 1;
    }
  });
  
  return stats;
}

module.exports = router;
