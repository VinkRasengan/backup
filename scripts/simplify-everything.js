#!/usr/bin/env node

/**
 * Simplify Everything Script
 * Replaces all complex scripts with single antifraud.js command
 */

const fs = require('fs').promises;
const path = require('path');

class Simplifier {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    
    // Scripts to remove (all the complex ones)
    this.scriptsToRemove = [
      'unified-deployment.js',
      'setup-tech-stack.js',
      'cleanup-deprecated-scripts.js',
      'upgrade-package-json.js',
      'complete-optimization.js',
      'run-integration-tests.js'
    ];
    
    // Directories to clean up
    this.dirsToClean = [
      'utils',
      'monitoring'
    ];
  }

  async simplify() {
    try {
      console.log('🧹 Simplifying everything to single command...');
      console.log('='.repeat(50));

      // 1. Backup current state
      await this.backup();

      // 2. Replace package.json
      await this.replacePackageJson();

      // 3. Remove complex scripts
      await this.removeComplexScripts();

      // 4. Create simple README
      await this.createSimpleReadme();

      // 5. Verify simplification
      await this.verify();

      console.log('\n✅ Simplification completed!');
      this.showUsage();

    } catch (error) {
      console.error('❌ Simplification failed:', error.message);
      process.exit(1);
    }
  }

  async backup() {
    console.log('💾 Creating backup...');
    
    const backupDir = path.join(this.projectRoot, 'backup-before-simplify');
    await fs.mkdir(backupDir, { recursive: true });

    // Backup package.json
    try {
      await fs.copyFile(
        path.join(this.projectRoot, 'package.json'),
        path.join(backupDir, 'package.json')
      );
    } catch {}

    // Backup scripts directory
    try {
      await this.copyDirectory(
        path.join(this.projectRoot, 'scripts'),
        path.join(backupDir, 'scripts')
      );
    } catch {}

    console.log(`✅ Backup created: ${backupDir}`);
  }

  async replacePackageJson() {
    console.log('📦 Replacing package.json with simplified version...');
    
    try {
      // Copy optimized version to main
      await fs.copyFile(
        path.join(this.projectRoot, 'package-optimized.json'),
        path.join(this.projectRoot, 'package.json')
      );
      
      console.log('✅ Package.json replaced');
    } catch (error) {
      throw new Error(`Failed to replace package.json: ${error.message}`);
    }
  }

  async removeComplexScripts() {
    console.log('🗑️  Removing complex scripts...');
    
    let removedCount = 0;
    
    // Remove individual scripts
    for (const script of this.scriptsToRemove) {
      try {
        const scriptPath = path.join(this.projectRoot, 'scripts', script);
        await fs.unlink(scriptPath);
        console.log(`  ❌ Removed: ${script}`);
        removedCount++;
      } catch {
        // File doesn't exist
      }
    }

    // Remove directories
    for (const dir of this.dirsToClean) {
      try {
        const dirPath = path.join(this.projectRoot, 'scripts', dir);
        await this.removeDirectory(dirPath);
        console.log(`  ❌ Removed directory: ${dir}`);
        removedCount++;
      } catch {
        // Directory doesn't exist
      }
    }

    // Remove other unnecessary files
    const unnecessaryFiles = [
      'package-optimized.json',
      'docker-compose.enhanced.yml',
      'tech-stack-config.json',
      'monitoring-config.json'
    ];

    for (const file of unnecessaryFiles) {
      try {
        await fs.unlink(path.join(this.projectRoot, file));
        console.log(`  ❌ Removed: ${file}`);
        removedCount++;
      } catch {
        // File doesn't exist
      }
    }

    console.log(`✅ Removed ${removedCount} unnecessary files/directories`);
  }

  async createSimpleReadme() {
    console.log('📚 Creating simple README...');
    
    const readmeContent = `# Anti-Fraud Platform

## 🚀 One Command Does Everything

\`\`\`bash
# First time setup
npm run setup

# Start development
npm start

# Deploy with Docker  
npm run docker

# Deploy to Kubernetes
npm run deploy:k8s

# Run all tests
npm test

# Check status
npm run status

# Get help
npm run help
\`\`\`

## 📋 All Available Commands

| Command | Description |
|---------|-------------|
| \`npm run setup\` | Complete setup and installation |
| \`npm start\` | Start all services locally |
| \`npm run dev\` | Start in development mode |
| \`npm stop\` | Stop all services |
| \`npm restart\` | Restart all services |
| \`npm run docker\` | Deploy with Docker Compose |
| \`npm run deploy:k8s\` | Deploy to Kubernetes |
| \`npm test\` | Run all tests |
| \`npm run status\` | Show system status |
| \`npm run health\` | Health check |
| \`npm run logs\` | Show logs |
| \`npm run fix-ports\` | Fix port conflicts |
| \`npm run clean\` | Clean up everything |
| \`npm run help\` | Show detailed help |

## 🏗️ Architecture

- **Frontend**: React (port 3000)
- **API Gateway**: Express.js (port 8080) 
- **Auth Service**: Node.js (port 3001)
- **Link Service**: Node.js (port 3002)
- **Community Service**: Node.js (port 3003)
- **Chat Service**: Node.js (port 3004)
- **News Service**: Node.js (port 3005)
- **Admin Service**: Node.js (port 3006)

## 🔧 Tech Stack Features

✅ **Circuit Breaker Pattern** - Prevents cascade failures  
✅ **Event-Driven Architecture** - Redis pub/sub  
✅ **Service Authentication** - Individual service keys  
✅ **Auth Service Redundancy** - Multiple auth instances  
✅ **Contract Testing** - Pact framework  
✅ **Integration Testing** - E2E pipeline  
✅ **Monitoring** - Prometheus + Grafana  
✅ **Service Mesh Ready** - Istio/Consul support  

## 🚀 Quick Start

\`\`\`bash
# Clone and setup
git clone <repo-url>
cd backup
npm run setup

# Start development
npm start

# Open browser
open http://localhost:3000
\`\`\`

## 📊 Monitoring

- **Application**: http://localhost:3000
- **API Gateway**: http://localhost:8080  
- **Monitoring**: http://localhost:9090
- **Status**: \`npm run status\`

## 🧪 Testing

\`\`\`bash
npm test              # All tests
npm run test:unit     # Unit tests only
npm run test:contract # Contract tests only
npm run test:integration # Integration tests only
\`\`\`

## 🐳 Docker Deployment

\`\`\`bash
npm run docker        # Start with Docker
npm run logs          # View logs
npm stop              # Stop everything
\`\`\`

## ☸️ Kubernetes Deployment

\`\`\`bash
npm run deploy:k8s           # Basic K8s
npm run deploy:k8s:istio     # With Istio service mesh
npm run deploy:k8s:consul    # With Consul Connect
\`\`\`

## 🛠️ Troubleshooting

\`\`\`bash
npm run fix-ports     # Fix port conflicts
npm run clean         # Clean everything
npm run status        # Check what's running
npm run health        # Health check
\`\`\`

## 📄 License

MIT License
`;

    await fs.writeFile(
      path.join(this.projectRoot, 'README.md'),
      readmeContent
    );

    console.log('✅ Simple README created');
  }

  async verify() {
    console.log('🔍 Verifying simplification...');
    
    // Check if antifraud.js exists
    try {
      await fs.access(path.join(this.projectRoot, 'scripts', 'antifraud.js'));
      console.log('✅ Main script exists');
    } catch {
      throw new Error('Main antifraud.js script not found');
    }

    // Check if package.json is valid
    try {
      const content = await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8');
      const config = JSON.parse(content);
      
      if (!config.scripts.start || !config.scripts.setup) {
        throw new Error('Required scripts missing from package.json');
      }
      
      console.log('✅ Package.json is valid');
    } catch (error) {
      throw new Error(`Package.json validation failed: ${error.message}`);
    }

    console.log('✅ Verification passed');
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async removeDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.removeDirectory(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }

      await fs.rmdir(dirPath);
    } catch (error) {
      // Directory might not exist or be empty
    }
  }

  showUsage() {
    console.log('\n🎉 Everything is now simplified!');
    console.log('='.repeat(50));
    console.log('✅ Single script handles everything: scripts/antifraud.js');
    console.log('✅ Simple package.json with unified commands');
    console.log('✅ Removed all complex/duplicate scripts');
    console.log('✅ Clean and easy to understand');
    
    console.log('\n🚀 Try it now:');
    console.log('npm run setup     # First time setup');
    console.log('npm start         # Start development');
    console.log('npm run docker    # Deploy with Docker');
    console.log('npm test          # Run tests');
    console.log('npm run status    # Check status');
    console.log('npm run help      # Get help');
    
    console.log('\n📁 Project structure:');
    console.log('├── scripts/');
    console.log('│   └── antifraud.js     # Single script for everything');
    console.log('├── services/            # All microservices');
    console.log('├── client/              # React frontend');
    console.log('├── package.json         # Simplified scripts');
    console.log('└── README.md            # Simple documentation');
    
    console.log('\n💡 Benefits:');
    console.log('- One command does everything');
    console.log('- No more script confusion');
    console.log('- Easy to learn and use');
    console.log('- All tech stack features included');
    console.log('- Cross-platform compatible');
  }
}

// CLI handling
async function main() {
  const simplifier = new Simplifier();
  
  if (process.argv.includes('--help')) {
    console.log('Simplify Everything Script');
    console.log('Usage: node scripts/simplify-everything.js');
    console.log('\nThis script will:');
    console.log('- Replace package.json with simplified version');
    console.log('- Remove all complex scripts');
    console.log('- Keep only the single antifraud.js script');
    console.log('- Create simple documentation');
    return;
  }

  await simplifier.simplify();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = Simplifier;
