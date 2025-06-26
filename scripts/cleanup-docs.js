#!/usr/bin/env node

/**
 * Documentation cleanup script
 * Moves important docs to docs folder and removes redundant files
 */

const fs = require('fs');
const path = require('path');

// Files to keep in docs folder (move if not already there)
const IMPORTANT_DOCS = [
  'README.md',
  'SECURITY.md',
  'MAINTENANCE.md',
  'PERFORMANCE.md',
  'USAGE-GUIDE.md',
  'RENDER_DEPLOYMENT_CHECKLIST.md'
];

// Files to remove (redundant or outdated)
const FILES_TO_REMOVE = [
  'API_ANALYSIS_REPORT.md',
  'API_GATEWAY_404_DEBUG.md',
  'API_GATEWAY_VERIFICATION_REPORT.md',
  'AUDIT_QUICK_REFERENCE.md',
  'COMMUNITY_SERVICE_REVIEW_SUMMARY.md',
  'COMPREHENSIVE_AUDIT_REPORT.md',
  'CORRECT_DEPLOYMENT_GUIDE.md',
  'CORS_HEADERS_FIX.md',
  'ENV_SETUP_GUIDE.md',
  'FINAL_FIX_GUIDE.md',
  'FIREBASE_REFRESH_TOKEN_ANALYSIS.md',
  'FRONTEND_API_FIX.md',
  'IMMEDIATE_FIX_GUIDE.md',
  'MONITORING_SETUP.md',
  'PORT_CONFIGURATION_FIXES.md',
  'PROXY_ERRORS_FIXED.md',
  'QUICK_DEPLOY.md',
  'README-ENHANCED.md',
  'README-FINAL.md',
  'RENDER_COMPLETE_SETUP.md',
  'RENDER_DEPLOYMENT_FIX.md',
  'RENDER_DOCKER_DEPLOYMENT_GUIDE.md',
  'RENDER_DOCKER_INSTRUCTIONS.md',
  'RENDER_ENV_VARS.md',
  'RENDER_QUICK_DEPLOY.md',
  'SYSTEM_AUDIT_PROMPT.md',
  'URGENT_API_FORMAT_FIX.md',
  'URGENT_FIX_GUIDE.md',
  'VOTING_INTEGRATION_FIX.md',
  'VOTING_PROXY_ERROR_FIX.md',
  'demo-deployment.md'
];

// Test files to remove
const TEST_FILES_TO_REMOVE = [
  'test-api-endpoints.js',
  'test-api-format.js',
  'test-auth-voting.js',
  'test-comment.json',
  'test-comments-api.js',
  'test-community-service.js',
  'test-firebase-connection.js',
  'test-simple-vote.js',
  'test-vote-timing.js',
  'test-voting-commenting.js',
  'test-voting.json',
  'quick-test-community.js',
  'create-mock-comments.js',
  'simple-test.html'
];

// Config files to remove
const CONFIG_FILES_TO_REMOVE = [
  'auth-redundancy-config.json',
  'contract-test-config.json',
  'integration-test-config.json',
  'redis-config.json',
  'tech-stack.json',
  'service-keys.json',
  'webhook-service.pid'
];

// Script files to remove
const SCRIPT_FILES_TO_REMOVE = [
  'audit-api-calls.ps1',
  'audit-api-calls.sh',
  'deploy-render-docker.ps1',
  'deploy-render.ps1'
];

// Backup files to remove
const BACKUP_FILES_TO_REMOVE = [
  'package-backup.json',
  'package-optimized.json',
  'package-optimized.json.backup',
  'render-docker.yaml',
  'firebase-debug.log'
];

function ensureDocsDir() {
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log('📁 Created docs directory');
  }
}

function moveToDocsIfExists(filename) {
  const sourcePath = path.join(process.cwd(), filename);
  const targetPath = path.join(process.cwd(), 'docs', filename);
  
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    try {
      fs.renameSync(sourcePath, targetPath);
      console.log(`📄 Moved ${filename} to docs/`);
    } catch (error) {
      console.error(`❌ Error moving ${filename}:`, error.message);
    }
  }
}

function removeFileIfExists(filename) {
  const filePath = path.join(process.cwd(), filename);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${filename}`);
    } catch (error) {
      console.error(`❌ Error removing ${filename}:`, error.message);
    }
  }
}

function removeDirIfExists(dirname) {
  const dirPath = path.join(process.cwd(), dirname);
  
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Removed directory ${dirname}`);
    } catch (error) {
      console.error(`❌ Error removing directory ${dirname}:`, error.message);
    }
  }
}

function cleanupDocs() {
  console.log('🧹 Starting documentation cleanup...');
  
  // Ensure docs directory exists
  ensureDocsDir();
  
  // Move important docs to docs folder
  console.log('\n📁 Moving important documentation to docs folder...');
  IMPORTANT_DOCS.forEach(moveToDocsIfExists);
  
  // Remove redundant documentation files
  console.log('\n🗑️  Removing redundant documentation files...');
  FILES_TO_REMOVE.forEach(removeFileIfExists);
  
  // Remove test files
  console.log('\n🗑️  Removing test files...');
  TEST_FILES_TO_REMOVE.forEach(removeFileIfExists);
  
  // Remove config files
  console.log('\n🗑️  Removing temporary config files...');
  CONFIG_FILES_TO_REMOVE.forEach(removeFileIfExists);
  
  // Remove script files
  console.log('\n🗑️  Removing redundant script files...');
  SCRIPT_FILES_TO_REMOVE.forEach(removeFileIfExists);
  
  // Remove backup files
  console.log('\n🗑️  Removing backup files...');
  BACKUP_FILES_TO_REMOVE.forEach(removeFileIfExists);
  
  // Remove backup directories
  console.log('\n🗑️  Removing backup directories...');
  removeDirIfExists('backup-before-simplify');
  removeDirIfExists('optimization-backup');
  removeDirIfExists('test-reports');
  removeDirIfExists('pacts');
  
  console.log('\n✅ Documentation cleanup completed!');
}

// Run if called directly
if (require.main === module) {
  cleanupDocs();
}

module.exports = { cleanupDocs };
