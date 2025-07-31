#!/usr/bin/env node

/**
 * Start Demo với Big Data Stack
 * Khởi động tất cả services cần thiết cho demo Hadoop & Spark
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class DemoStarter {
    constructor() {
        this.services = [
            {
                name: 'Spark Service',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../services/spark-service'),
                port: 3010,
                healthPath: '/health'
            },
            {
                name: 'ETL Service',
                command: 'npm', 
                args: ['start'],
                cwd: path.join(__dirname, '../services/etl-service'),
                port: 3008,
                healthPath: '/health'
            },
            {
                name: 'Analytics Service',
                command: 'npm',
                args: ['start'], 
                cwd: path.join(__dirname, '../services/analytics-service'),
                port: 3012,
                healthPath: '/health'
            },
            {
                name: 'Demo Server',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../presentation'),
                port: 3020,
                healthPath: '/health'
            }
        ];
        
        this.processes = [];
        this.isShuttingDown = false;
    }

    async startService(service) {
        return new Promise((resolve, reject) => {
            console.log(`🚀 Starting ${service.name}...`);
            
            const child = spawn(service.command, service.args, {
                cwd: service.cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: process.platform === 'win32'
            });

            child.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    console.log(`[${service.name}] ${message}`);
                }
            });

            child.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message && !message.includes('Warning')) {
                    console.error(`[${service.name}] ERROR: ${message}`);
                }
            });

            child.on('error', (error) => {
                console.error(`❌ Failed to start ${service.name}:`, error.message);
                reject(error);
            });

            child.on('exit', (code) => {
                if (!this.isShuttingDown && code !== 0) {
                    console.error(`❌ ${service.name} exited with code ${code}`);
                }
            });

            this.processes.push({
                name: service.name,
                process: child,
                port: service.port
            });

            // Wait a bit for service to start
            setTimeout(() => {
                console.log(`✅ ${service.name} started`);
                resolve();
            }, 2000);
        });
    }

    async checkHealth(service) {
        const maxRetries = 10;
        const retryDelay = 2000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.get(
                    `http://localhost:${service.port}${service.healthPath}`,
                    { timeout: 3000 }
                );
                
                if (response.status === 200) {
                    console.log(`✅ ${service.name} is healthy`);
                    return true;
                }
            } catch (error) {
                console.log(`🔄 ${service.name} health check ${attempt}/${maxRetries}...`);
                if (attempt < maxRetries) {
                    await this.delay(retryDelay);
                }
            }
        }
        
        console.log(`❌ ${service.name} health check failed`);
        return false;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async startAll() {
        console.log('🎯 Starting Big Data Demo Stack...\n');
        
        // Start services sequentially
        for (const service of this.services) {
            await this.startService(service);
            await this.delay(1000);
        }
        
        console.log('\n⏳ Waiting for services to be ready...\n');
        await this.delay(5000);
        
        // Check health of all services
        const healthChecks = this.services.map(service => this.checkHealth(service));
        const healthResults = await Promise.all(healthChecks);
        
        const healthyCount = healthResults.filter(result => result).length;
        const totalCount = healthResults.length;
        
        console.log(`\n📊 Health Summary: ${healthyCount}/${totalCount} services healthy`);
        
        if (healthyCount === totalCount) {
            console.log('\n🎉 All services are running!');
            console.log('\n📊 Demo URLs:');
            console.log('   • Presentation: http://localhost:3020/demo');
            console.log('   • API Status: http://localhost:3020/api/status');
            console.log('   • Spark Service: http://localhost:3010/health');
            console.log('   • ETL Service: http://localhost:3008/health');
            console.log('   • Analytics Service: http://localhost:3012/health');
            
            console.log('\n🔗 Infrastructure UIs:');
            console.log('   • Spark Master: http://localhost:8080');
            console.log('   • Spark History: http://localhost:8088'); 
            console.log('   • HDFS NameNode: http://localhost:9870');
            
            console.log('\n🎮 To test demo endpoints:');
            console.log('   npm run bigdata:test');
            
        } else {
            console.log('\n⚠️  Some services failed to start properly');
            console.log('Check the logs above for details');
        }
        
        console.log('\n🛑 Press Ctrl+C to stop all services');
    }

    setupGracefulShutdown() {
        const shutdown = () => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            
            console.log('\n🛑 Shutting down services...');
            
            this.processes.forEach(({ name, process }) => {
                console.log(`   Stopping ${name}...`);
                process.kill('SIGTERM');
            });
            
            setTimeout(() => {
                console.log('✅ All services stopped');
                process.exit(0);
            }, 3000);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
}

// Run if called directly
if (require.main === module) {
    const starter = new DemoStarter();
    starter.setupGracefulShutdown();
    starter.startAll().catch(console.error);
}

module.exports = DemoStarter;