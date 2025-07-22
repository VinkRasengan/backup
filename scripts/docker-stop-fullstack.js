#!/usr/bin/env node

/**
 * Docker Stop Fullstack - Stop all Docker services
 */

const { exec } = require('child_process');

class DockerStopFullstack {
  constructor() {
    this.rootDir = process.cwd();
    this.composeFile = 'docker-compose.yml';
  }

  async stop() {
    console.log('🛑 Stopping Docker Fullstack Services');
    console.log('=' .repeat(50));

    try {
      await this.stopServices();
      await this.cleanupContainers();
      this.showSummary();
    } catch (error) {
      console.error('❌ Stop failed:', error.message);
      process.exit(1);
    }
  }

  async stopServices() {
    console.log('🛑 Stopping all services...');
    
    try {
      await this.execAsync(`docker compose -f ${this.composeFile} down`);
      console.log('  ✅ All services stopped');
    } catch (error) {
      console.log('  ⚠️  Some services may already be stopped');
    }
  }

  async cleanupContainers() {
    console.log('🧹 Cleaning up containers and networks...');
    
    try {
      await this.execAsync(`docker compose -f ${this.composeFile} down --remove-orphans`);
      console.log('  ✅ Cleanup completed');
    } catch (error) {
      console.log('  ⚠️  Cleanup completed with warnings');
    }
  }

  showSummary() {
    console.log('\n✅ Docker Fullstack Services Stopped');
    console.log('=' .repeat(50));
    console.log('\n💡 To start again, run:');
    console.log('  npm run docker:fullstack');
    console.log('\n📝 Other useful commands:');
    console.log('  docker compose ps        - Check status');
    console.log('  docker compose logs      - View logs');
    console.log('  docker system prune      - Clean up unused resources');
  }

  execAsync(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.rootDir }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
}

// Run stop
if (require.main === module) {
  const stopper = new DockerStopFullstack();
  stopper.stop().catch(console.error);
}

module.exports = DockerStopFullstack;
