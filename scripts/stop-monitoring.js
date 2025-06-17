const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛑 Stopping Monitoring Stack...');

// Stop Docker containers
console.log('🐳 Stopping Docker containers...');
try {
  execSync('docker-compose -f docker-compose.monitoring.yml down', { stdio: 'inherit' });
  console.log('✅ Docker containers stopped');
} catch (error) {
  console.error('❌ Error stopping Docker containers:', error.message);
}

// Stop webhook service
const pidFile = path.join(process.cwd(), 'webhook-service.pid');

if (fs.existsSync(pidFile)) {
  try {
    const pid = fs.readFileSync(pidFile, 'utf8').trim();
    console.log(`🛑 Stopping webhook service (PID: ${pid})...`);
    
    // Kill the process
    try {
      process.kill(parseInt(pid), 'SIGTERM');
      console.log('✅ Webhook service stopped');
    } catch (killError) {
      console.log('ℹ️  Webhook service was not running');
    }
    
    // Remove PID file
    fs.unlinkSync(pidFile);
  } catch (error) {
    console.error('❌ Error stopping webhook service:', error.message);
  }
} else {
  console.log('ℹ️  No webhook service PID file found');
}

// Clean up any remaining webhook processes (Windows)
try {
  execSync('taskkill /f /im node.exe /fi "WINDOWTITLE eq webhook-service*"', { stdio: 'ignore' });
} catch {
  // Ignore errors - process might not exist
}

// Clean up Docker resources (optional)
console.log('🧹 Cleaning up Docker resources...');
try {
  execSync('docker system prune -f --volumes', { stdio: 'ignore' });
  console.log('✅ Docker cleanup completed');
} catch (error) {
  console.log('ℹ️  Docker cleanup skipped');
}

console.log('✅ Monitoring Stack stopped successfully!');
console.log('');
console.log('💡 To restart monitoring:');
console.log('   npm run monitoring:start');
