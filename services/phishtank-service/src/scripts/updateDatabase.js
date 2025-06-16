const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const PHISHTANK_DATA_URL = 'http://data.phishtank.com/data/online-valid.json';
const DATABASE_PATH = path.join(__dirname, '../../data/phishtank-database.json');
const STATS_PATH = path.join(__dirname, '../../data/database-stats.json');

async function updatePhishTankDatabase() {
  console.log('🔄 Starting PhishTank database update...');
  
  try {
    // Ensure data directory exists
    await fs.ensureDir(path.dirname(DATABASE_PATH));
    
    console.log('📥 Downloading PhishTank data...');
    
    // Download data with timeout
    const response = await axios.get(PHISHTANK_DATA_URL, {
      timeout: 60000, // 60 seconds timeout
      headers: {
        'User-Agent': 'Anti-Fraud-Platform/1.0 (PhishTank Service)'
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid data format received from PhishTank');
    }
    
    const phishData = response.data;
    console.log(`📊 Downloaded ${phishData.length} phishing entries`);
    
    // Filter only verified and online entries
    const validEntries = phishData.filter(entry => 
      entry.verified === 'yes' && entry.online === 'yes'
    );
    
    console.log(`✅ Filtered to ${validEntries.length} verified and online entries`);
    
    // Save database
    await fs.writeJson(DATABASE_PATH, validEntries, { spaces: 2 });
    
    // Generate and save statistics
    const stats = generateDatabaseStats(validEntries);
    stats.lastUpdated = new Date().toISOString();
    stats.totalEntries = validEntries.length;
    stats.downloadedEntries = phishData.length;
    
    await fs.writeJson(STATS_PATH, stats, { spaces: 2 });
    
    console.log('✅ PhishTank database updated successfully');
    console.log(`📈 Statistics: ${stats.totalEntries} entries, ${stats.verified} verified, ${stats.online} online`);
    
    return {
      success: true,
      totalEntries: validEntries.length,
      downloadedEntries: phishData.length,
      stats
    };
    
  } catch (error) {
    console.error('❌ Failed to update PhishTank database:', error.message);
    
    // If download fails, check if we have existing database
    if (await fs.pathExists(DATABASE_PATH)) {
      console.log('📂 Using existing database');
      return {
        success: false,
        error: error.message,
        usingExisting: true
      };
    }
    
    // Create empty database as fallback
    await fs.ensureDir(path.dirname(DATABASE_PATH));
    await fs.writeJson(DATABASE_PATH, []);
    await fs.writeJson(STATS_PATH, {
      totalEntries: 0,
      verified: 0,
      online: 0,
      lastUpdated: new Date().toISOString(),
      error: error.message
    });
    
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

function generateDatabaseStats(database) {
  const stats = {
    totalEntries: database.length,
    verified: database.filter(entry => entry.verified === 'yes').length,
    online: database.filter(entry => entry.online === 'yes').length,
    targets: {},
    submissionDates: {},
    topTargets: []
  };
  
  // Count targets
  database.forEach(entry => {
    const target = entry.target || 'Unknown';
    stats.targets[target] = (stats.targets[target] || 0) + 1;
  });
  
  // Get top 10 targets
  stats.topTargets = Object.entries(stats.targets)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([target, count]) => ({ target, count }));
  
  // Count by submission date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  database.forEach(entry => {
    if (entry.submission_time) {
      const submissionDate = new Date(entry.submission_time);
      if (submissionDate >= thirtyDaysAgo) {
        const date = entry.submission_time.split('T')[0];
        stats.submissionDates[date] = (stats.submissionDates[date] || 0) + 1;
      }
    }
  });
  
  return stats;
}

// Export for use in other modules
module.exports = {
  updatePhishTankDatabase,
  generateDatabaseStats
};

// If run directly, execute update
if (require.main === module) {
  updatePhishTankDatabase()
    .then(result => {
      console.log('Update result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}
