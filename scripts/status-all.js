#!/usr/bin/env node

/**
 * Status All - Universal Status Check Script
 * Shows status of all services across different deployment methods
 */

import { exec  } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

class UniversalStatus {
  constructor() {
    this.rootDir = process.cwd();
    this.services = [
      { name: 'Redis', port: 6379, type: 'infrastructure' },
      { name: 'Auth Service', port: 3001, type: 'microservice', healthPath: '/health' },
      { name: 'Link Service', port: 3002, type: 'microservice', healthPath: '/health' },
      { name: 'Community Service', port: 3003, type: 'microservice', healthPath: '/health' },
      { name: 'Chat Service', port: 3004, type: 'microservice', healthPath: '/health' },
      { name: 'News Service', port: 3005, type: 'microservice', healthPath: '/health' },
      { name: 'Admin Service', port: 3006, type: 'microservice', healthPath: '/health' },
      { name: 'API Gateway', port: 8080, type: 'gateway', healthPath: '/health' },
      { name: 'Client (Frontend)', port: 3000, type: 'frontend' }
    ];
  }

  /**
   * Main status check function
   */
  async checkStatus() {
    console.log('📊 Universal Status Check - All Services');
    console.log('=' .repeat(60));

    try {
      const results = {
        processes: await this.checkProcesses(),
        docker: await this.checkDockerContainers(),
        kubernetes: await this.checkKubernetesServices(),
        health: await this.checkHealthEndpoints()
      };

      this.displayResults(results);
    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check running processes
   */
  async checkProcesses() {
    console.log('🔍 Checking running processes...');
    const processStatus = {};

    for (const service of this.services) {
      try {
        const isRunning = await this.isPortInUse(service.port);
        processStatus[service.name] = {
          running: isRunning,
          port: service.port,
          pid: isRunning ? await this.getPidByPort(service.port) : null
        };
      } catch (error) {
        processStatus[service.name] = {
          running: false,
          port: service.port,
          pid: null
        };
      }
    }

    return processStatus;
  }

  /**
   * Check Docker containers
   */
  async checkDockerContainers() {
    console.log('🐳 Checking Docker containers...');
    const dockerStatus = {};

    try {
      await this.execAsync('docker --version');
      
      const containerPatterns = [
        { pattern: 'factcheck-redis', service: 'Redis' },
        { pattern: 'factcheck-auth', service: 'Auth Service' },
        { pattern: 'factcheck-link', service: 'Link Service' },
        { pattern: 'factcheck-community', service: 'Community Service' },
        { pattern: 'factcheck-chat', service: 'Chat Service' },
        { pattern: 'factcheck-news', service: 'News Service' },
        { pattern: 'factcheck-admin', service: 'Admin Service' },
        { pattern: 'factcheck-gateway', service: 'API Gateway' },
        { pattern: 'factcheck-client', service: 'Client (Frontend)' }
      ];

      for (const { pattern, service } of containerPatterns) {
        try {
          const containers = await this.execAsync(`docker ps --filter "name=${pattern}" --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"`);
          
          if (containers.trim()) {
            const lines = containers.trim().split('\n');
            dockerStatus[service] = lines.map(line => {
              const [name, status, ports] = line.split('\t');
              return { name, status, ports };
            });
          } else {
            dockerStatus[service] = [];
          }
        } catch (error) {
          dockerStatus[service] = [];
        }
      }

    } catch (error) {
      console.log('  ⚠️  Docker not available');
      return null;
    }

    return dockerStatus;
  }

  /**
   * Check Kubernetes services
   */
  async checkKubernetesServices() {
    console.log('☸️  Checking Kubernetes services...');
    const k8sStatus = {};

    try {
      await this.execAsync('kubectl version --client --short');
      
      const namespaces = ['factcheck-local', 'anti-fraud-platform', 'antifraud'];
      
      for (const namespace of namespaces) {
        try {
          await this.execAsync(`kubectl get namespace ${namespace}`);
          
          const pods = await this.execAsync(`kubectl get pods -n ${namespace} --no-headers`);
          const services = await this.execAsync(`kubectl get services -n ${namespace} --no-headers`);
          
          k8sStatus[namespace] = {
            pods: pods.trim() ? pods.trim().split('\n').map(line => {
              const parts = line.split(/\s+/);
              return {
                name: parts[0],
                ready: parts[1],
                status: parts[2],
                restarts: parts[3],
                age: parts[4]
              };
            }) : [],
            services: services.trim() ? services.trim().split('\n').map(line => {
              const parts = line.split(/\s+/);
              return {
                name: parts[0],
                type: parts[1],
                clusterIP: parts[2],
                externalIP: parts[3],
                ports: parts[4],
                age: parts[5]
              };
            }) : []
          };
          
        } catch (error) {
          // Namespace doesn't exist
        }
      }

    } catch (error) {
      console.log('  ⚠️  kubectl not available');
      return null;
    }

    return k8sStatus;
  }

  /**
   * Check health endpoints
   */
  async checkHealthEndpoints() {
    console.log('🏥 Checking health endpoints...');
    const healthStatus = {};

    for (const service of this.services) {
      if (service.healthPath) {
        try {
          const url = `http://localhost:${service.port}${service.healthPath}`;
          const response = await this.httpGet(url);
          healthStatus[service.name] = {
            healthy: true,
            status: response.statusCode,
            url: url
          };
        } catch (error) {
          healthStatus[service.name] = {
            healthy: false,
            error: error.message,
            url: `http://localhost:${service.port}${service.healthPath}`
          };
        }
      }
    }

    return healthStatus;
  }

  /**
   * Display comprehensive results
   */
  displayResults(results) {
    console.log('\n📋 Service Status Summary');
    console.log('=' .repeat(60));

    // Process Status
    console.log('\n🔧 Process Status:');
    console.log('Service'.padEnd(20) + 'Status'.padEnd(12) + 'Port'.padEnd(8) + 'PID');
    console.log('-'.repeat(50));
    
    for (const [serviceName, status] of Object.entries(results.processes)) {
      const statusIcon = status.running ? '🟢 Running' : '🔴 Stopped';
      const pid = status.pid ? status.pid : 'N/A';
      console.log(
        serviceName.padEnd(20) + 
        statusIcon.padEnd(12) + 
        status.port.toString().padEnd(8) + 
        pid
      );
    }

    // Docker Status
    if (results.docker) {
      console.log('\n🐳 Docker Container Status:');
      let hasContainers = false;
      
      for (const [serviceName, containers] of Object.entries(results.docker)) {
        if (containers.length > 0) {
          hasContainers = true;
          containers.forEach(container => {
            const statusIcon = container.status.includes('Up') ? '🟢' : '🔴';
            console.log(`  ${statusIcon} ${container.name} - ${container.status}`);
          });
        }
      }
      
      if (!hasContainers) {
        console.log('  ⚪ No Docker containers running');
      }
    }

    // Kubernetes Status
    if (results.kubernetes && Object.keys(results.kubernetes).length > 0) {
      console.log('\n☸️  Kubernetes Status:');
      
      for (const [namespace, status] of Object.entries(results.kubernetes)) {
        console.log(`\n  Namespace: ${namespace}`);
        
        if (status.pods.length > 0) {
          console.log('    Pods:');
          status.pods.forEach(pod => {
            const statusIcon = pod.status === 'Running' ? '🟢' : 
                              pod.status === 'Pending' ? '🟡' : '🔴';
            console.log(`      ${statusIcon} ${pod.name} (${pod.ready}) - ${pod.status}`);
          });
        }
        
        if (status.services.length > 0) {
          console.log('    Services:');
          status.services.forEach(svc => {
            console.log(`      🌐 ${svc.name} - ${svc.type} (${svc.ports})`);
          });
        }
      }
    }

    // Health Status
    console.log('\n🏥 Health Check Status:');
    for (const [serviceName, health] of Object.entries(results.health)) {
      const statusIcon = health.healthy ? '🟢 Healthy' : '🔴 Unhealthy';
      const details = health.healthy ? `(${health.status})` : `(${health.error})`;
      console.log(`  ${serviceName.padEnd(20)} ${statusIcon} ${details}`);
    }

    // Quick Access URLs
    console.log('\n🌐 Quick Access URLs:');
    const runningServices = Object.entries(results.processes)
      .filter(([_, status]) => status.running);
    
    if (runningServices.length > 0) {
      runningServices.forEach(([serviceName, status]) => {
        const service = this.services.find(s => s.name === serviceName);
        if (service && service.type !== 'infrastructure') {
          console.log(`  ${serviceName}: http://localhost:${status.port}`);
        }
      });
    } else {
      console.log('  ⚪ No services currently running');
    }

    // Summary
    const totalServices = this.services.length;
    const runningCount = Object.values(results.processes).filter(s => s.running).length;
    const healthyCount = Object.values(results.health).filter(h => h.healthy).length;
    
    console.log('\n📊 Summary:');
    console.log(`  Services Running: ${runningCount}/${totalServices}`);
    console.log(`  Health Checks Passing: ${healthyCount}/${Object.keys(results.health).length}`);
    
    if (runningCount === totalServices && healthyCount === Object.keys(results.health).length) {
      console.log('  🎉 All systems operational!');
    } else if (runningCount > 0) {
      console.log('  ⚠️  Some services need attention');
    } else {
      console.log('  🔴 No services running - use "npm start" to deploy');
    }
  }

  /**
   * Utility functions
   */
  async isPortInUse(port) {
    try {
      if (os.platform() === 'win32') {
        const result = await this.execAsync(`netstat -ano | findstr :${port}`);
        return result.trim().length > 0;
      } else {
        const result = await this.execAsync(`lsof -i:${port}`);
        return result.trim().length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  async getPidByPort(port) {
    try {
      if (os.platform() === 'win32') {
        const result = await this.execAsync(`netstat -ano | findstr :${port}`);
        const lines = result.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            return parts[parts.length - 1];
          }
        }
      } else {
        const result = await this.execAsync(`lsof -ti:${port}`);
        return result.trim().split('\n')[0];
      }
    } catch (error) {
      return null;
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 10000, ...options }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const request = http.get(url, (response) => {
        resolve(response);
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

// Run status check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const status = new UniversalStatus();
  status.checkStatus().catch(console.error);
}

export default UniversalStatus;
