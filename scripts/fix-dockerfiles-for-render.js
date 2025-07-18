#!/usr/bin/env node

/**
 * Fix Dockerfiles for Render Deployment
 * Ensures all Dockerfiles are optimized for Render deployment
 */

const fs = require('fs');
const path = require('path');

class DockerfileRenderFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.services = [
      'api-gateway',
      'auth-service',
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service'
    ];
    this.fixed = [];
    this.errors = [];
  }

  async fixAllDockerfiles() {
    console.log('🐳 Fixing Dockerfiles for Render Deployment');
    console.log('='.repeat(50));

    for (const service of this.services) {
      await this.fixServiceDockerfile(service);
    }

    this.generateReport();
    return this.errors.length === 0;
  }

  async fixServiceDockerfile(serviceName) {
    const servicePath = path.join(this.projectRoot, 'services', serviceName);
    const dockerfilePath = path.join(servicePath, 'Dockerfile');

    if (!fs.existsSync(servicePath)) {
      this.errors.push(`❌ Service directory not found: ${serviceName}`);
      return;
    }

    if (!fs.existsSync(dockerfilePath)) {
      // Create a standard Dockerfile for services without one
      await this.createStandardDockerfile(serviceName, servicePath);
      return;
    }

    try {
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      const fixedContent = this.fixDockerfileContent(serviceName, content);
      
      if (fixedContent !== content) {
        fs.writeFileSync(dockerfilePath, fixedContent);
        this.fixed.push(`✅ Fixed Dockerfile for ${serviceName}`);
      } else {
        this.fixed.push(`✅ ${serviceName} Dockerfile already correct`);
      }

    } catch (error) {
      this.errors.push(`❌ Error fixing ${serviceName}: ${error.message}`);
    }
  }

  fixDockerfileContent(serviceName, content) {
    let fixed = content;

    // Ensure proper Node.js base image
    if (!fixed.includes('FROM node:')) {
      fixed = 'FROM node:18-alpine\n\n' + fixed;
    }

    // Ensure WORKDIR is set
    if (!fixed.includes('WORKDIR')) {
      const fromIndex = fixed.indexOf('FROM');
      const nextLineIndex = fixed.indexOf('\n', fromIndex) + 1;
      fixed = fixed.slice(0, nextLineIndex) + '\nWORKDIR /app\n' + fixed.slice(nextLineIndex);
    }

    // Ensure package.json is copied
    if (!fixed.includes('COPY package') && !fixed.includes('COPY ./package')) {
      const workdirIndex = fixed.indexOf('WORKDIR');
      const nextLineIndex = fixed.indexOf('\n', workdirIndex) + 1;
      fixed = fixed.slice(0, nextLineIndex) + '\nCOPY package*.json ./\n' + fixed.slice(nextLineIndex);
    }

    // Ensure dependencies are installed
    if (!fixed.includes('npm install') && !fixed.includes('npm ci')) {
      const packageIndex = fixed.indexOf('COPY package');
      const nextLineIndex = fixed.indexOf('\n', packageIndex) + 1;
      fixed = fixed.slice(0, nextLineIndex) + '\nRUN npm ci --only=production\n' + fixed.slice(nextLineIndex);
    }

    // Ensure source code is copied
    if (!fixed.includes('COPY . .') && !fixed.includes('COPY src/')) {
      const npmIndex = Math.max(fixed.indexOf('npm install'), fixed.indexOf('npm ci'));
      if (npmIndex !== -1) {
        const nextLineIndex = fixed.indexOf('\n', npmIndex) + 1;
        fixed = fixed.slice(0, nextLineIndex) + '\nCOPY . .\n' + fixed.slice(nextLineIndex);
      }
    }

    // Ensure port is exposed
    const portMap = {
      'api-gateway': 8080,
      'auth-service': 3001,
      'link-service': 3002,
      'community-service': 3003,
      'chat-service': 3004,
      'news-service': 3005,
      'admin-service': 3006,
      'phishtank-service': 3007,
      'criminalip-service': 3008
    };

    const port = portMap[serviceName] || 3000;
    if (!fixed.includes('EXPOSE')) {
      const copyIndex = fixed.lastIndexOf('COPY');
      const nextLineIndex = fixed.indexOf('\n', copyIndex) + 1;
      fixed = fixed.slice(0, nextLineIndex) + `\nEXPOSE ${port}\n` + fixed.slice(nextLineIndex);
    }

    // Ensure CMD or ENTRYPOINT exists
    if (!fixed.includes('CMD') && !fixed.includes('ENTRYPOINT')) {
      const entryPoint = this.getServiceEntryPoint(serviceName);
      fixed += `\nCMD ["node", "${entryPoint}"]\n`;
    }

    return fixed;
  }

  async createStandardDockerfile(serviceName, servicePath) {
    const port = {
      'api-gateway': 8080,
      'auth-service': 3001,
      'link-service': 3002,
      'community-service': 3003,
      'chat-service': 3004,
      'news-service': 3005,
      'admin-service': 3006,
      'phishtank-service': 3007,
      'criminalip-service': 3008
    }[serviceName] || 3000;

    const entryPoint = this.getServiceEntryPoint(serviceName);

    const dockerfile = `# Dockerfile for ${serviceName}
# Optimized for Render deployment
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files for better caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose service port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

# Start the service
CMD ["node", "${entryPoint}"]
`;

    const dockerfilePath = path.join(servicePath, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfile);
    this.fixed.push(`✅ Created Dockerfile for ${serviceName}`);
  }

  getServiceEntryPoint(serviceName) {
    const servicePath = path.join(this.projectRoot, 'services', serviceName);
    
    // Check common entry points
    const possibleEntryPoints = [
      'app.js',
      'src/app.js',
      'index.js',
      'src/index.js'
    ];

    for (const entryPoint of possibleEntryPoints) {
      if (fs.existsSync(path.join(servicePath, entryPoint))) {
        return entryPoint;
      }
    }

    // Default to src/app.js
    return 'src/app.js';
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Dockerfile Render Fix Report');
    console.log('='.repeat(50));

    if (this.fixed.length > 0) {
      console.log('\n✅ FIXED:');
      this.fixed.forEach(fix => console.log(`   ${fix}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📈 Summary: ${this.fixed.length} fixed, ${this.errors.length} errors`);

    if (this.errors.length === 0) {
      console.log('🎉 All Dockerfiles ready for Render deployment!');
      console.log('\n💡 Next steps:');
      console.log('   1. Test with: npm run test:render');
      console.log('   2. Deploy individual services to Render');
      console.log('   3. Update service URLs in environment variables');
    } else {
      console.log('❌ Some Dockerfiles could not be fixed');
      console.log('💡 Please review the errors above and fix manually');
    }
  }
}

// Run fixer if called directly
if (require.main === module) {
  const fixer = new DockerfileRenderFixer();
  fixer.fixAllDockerfiles().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Dockerfile fixer failed:', error);
    process.exit(1);
  });
}

module.exports = DockerfileRenderFixer;
