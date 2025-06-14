#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Analyzes and optimizes the FactCheck platform performance
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class PerformanceOptimizer {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  // Check frontend bundle size and optimization
  checkFrontendOptimization() {
    console.log('🔍 Checking frontend optimization...');
    
    const clientPath = path.join(__dirname, 'client');
    const buildPath = path.join(clientPath, 'build');
    
    // Check if build exists
    if (!fs.existsSync(buildPath)) {
      this.issues.push('Frontend not built for production');
      this.recommendations.push('Run "npm run build" in client directory');
      return;
    }

    // Check for common optimization files
    const optimizationChecks = [
      { file: 'static/css', description: 'CSS optimization' },
      { file: 'static/js', description: 'JavaScript optimization' },
      { file: 'static/media', description: 'Media optimization' }
    ];

    optimizationChecks.forEach(check => {
      const fullPath = path.join(buildPath, check.file);
      if (!fs.existsSync(fullPath)) {
        this.issues.push(`Missing ${check.description}`);
      }
    });
  }

  // Check database query optimization
  async checkDatabaseOptimization() {
    console.log('🔍 Checking database optimization...');
    
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      const dbHealth = response.data.database;
      
      if (dbHealth.type === 'firestore') {
        this.recommendations.push('Consider implementing Firestore composite indexes for complex queries');
        this.recommendations.push('Use Firestore caching for frequently accessed data');
      }
      
      if (dbHealth.type === 'postgresql') {
        this.recommendations.push('Ensure proper PostgreSQL indexes are created');
        this.recommendations.push('Consider connection pooling for better performance');
      }
    } catch (error) {
      this.issues.push('Cannot connect to database for optimization check');
    }
  }

  // Check API response times
  async checkAPIPerformance() {
    console.log('🔍 Checking API performance...');
    
    const endpoints = [
      { url: '/health', name: 'Health Check' },
      { url: '/api/chat/test', name: 'Chat Test' },
      { url: '/api/community/posts?limit=5', name: 'Community Posts' }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        await axios.get(`http://localhost:5000${endpoint.url}`);
        const responseTime = Date.now() - startTime;
        
        if (responseTime > 1000) {
          this.issues.push(`Slow API response: ${endpoint.name} (${responseTime}ms)`);
        } else if (responseTime > 500) {
          this.recommendations.push(`Consider optimizing ${endpoint.name} (${responseTime}ms)`);
        }
      } catch (error) {
        this.issues.push(`API endpoint failed: ${endpoint.name}`);
      }
    }
  }

  // Check caching implementation
  checkCachingStrategy() {
    console.log('🔍 Checking caching strategy...');
    
    // Check if caching is implemented in community data
    const communityDataPath = path.join(__dirname, 'client/src/hooks/useCommunityData.js');
    if (fs.existsSync(communityDataPath)) {
      const content = fs.readFileSync(communityDataPath, 'utf8');
      if (content.includes('cache') && content.includes('Map')) {
        console.log('✅ Frontend caching implemented');
      } else {
        this.issues.push('Frontend caching not properly implemented');
      }
    }

    this.recommendations.push('Implement Redis caching for backend API responses');
    this.recommendations.push('Use browser caching headers for static assets');
    this.recommendations.push('Consider CDN for global content delivery');
  }

  // Check widget performance
  checkWidgetOptimization() {
    console.log('🔍 Checking widget optimization...');
    
    const widgetPath = path.join(__dirname, 'client/src/components/layout/WidgetManager.js');
    if (fs.existsSync(widgetPath)) {
      const content = fs.readFileSync(widgetPath, 'utf8');
      
      if (content.includes('position: fixed')) {
        console.log('✅ Widgets use fixed positioning');
      } else {
        this.issues.push('Widgets should use fixed positioning for better performance');
      }
      
      if (content.includes('AnimatePresence')) {
        console.log('✅ Widgets use optimized animations');
      }
    }
  }

  // Generate optimization report
  generateOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      recommendations: this.recommendations,
      summary: {
        totalIssues: this.issues.length,
        totalRecommendations: this.recommendations.length,
        performanceScore: Math.max(0, 100 - (this.issues.length * 10))
      }
    };

    // Save report to file
    fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2));
    
    return report;
  }

  // Print optimization results
  printResults(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE OPTIMIZATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Performance Score: ${report.summary.performanceScore}/100`);
    
    if (report.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      report.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n📄 Detailed report saved to: performance-report.json');
  }

  // Run all optimization checks
  async runOptimization() {
    console.log('🚀 Starting Performance Optimization Analysis...\n');
    
    this.checkFrontendOptimization();
    await this.checkDatabaseOptimization();
    await this.checkAPIPerformance();
    this.checkCachingStrategy();
    this.checkWidgetOptimization();
    
    const report = this.generateOptimizationReport();
    this.printResults(report);
    
    return report;
  }
}

// Run optimization if called directly
async function main() {
  const optimizer = new PerformanceOptimizer();
  
  try {
    await optimizer.runOptimization();
  } catch (error) {
    console.error('💥 Optimization analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceOptimizer;
