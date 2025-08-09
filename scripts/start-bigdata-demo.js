import { spawn  } from 'child_process';
const axios = require('axios');
import path from 'path';
const chalk = require('chalk');

class BigDataDemoStarter {
    constructor() {
        this.services = [
            // Core Big Data Services
            {
                name: 'Spark Service',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../services/spark-service'),
                port: 3010,
                healthPath: '/health',
                priority: 1,
                color: 'red',
                description: 'Machine Learning & Job Processing'
            },
            {
                name: 'Analytics Service',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../services/analytics-service'),
                port: 3012,
                healthPath: '/health',
                priority: 1,
                color: 'blue',
                description: 'Dashboard & Insights'
            },
            {
                name: 'ETL Service',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../services/etl-service'),
                port: 3008,
                healthPath: '/health',
                priority: 2,
                color: 'green',
                description: 'Data Pipeline Management',
                env: { ETL_SERVICE_PORT: '3008' }
            },
            
            // Frontend & Demo
            {
                name: 'Frontend Client',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../client'),
                port: 3000,
                healthPath: '/',
                priority: 3,
                color: 'magenta',
                description: 'React Frontend Application'
            },
            {
                name: 'Demo Server',
                command: 'npm',
                args: ['start'],
                cwd: path.join(__dirname, '../presentation'),
                port: 3020,
                healthPath: '/health',
                priority: 4,
                color: 'cyan',
                description: 'Hadoop & Spark Presentation'
            }
        ];
        
        this.processes = [];
        this.isShuttingDown = false;
    }

    log(service, message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            red: chalk.red,
            blue: chalk.blue,
            green: chalk.green,
            magenta: chalk.magenta,
            cyan: chalk.cyan,
            yellow: chalk.yellow
        };
        
        const color = colors[service.color] || chalk.white;
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔄';
        
        console.log(`${prefix} [${timestamp}] ${color(service.name)}: ${message}`);
    }

    async startService(service) {
        return new Promise((resolve, reject) => {
            this.log(service, `Starting on port ${service.port}...`);
            
            const child = spawn(service.command, service.args, {
                cwd: service.cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: process.platform === 'win32',
                env: { ...process.env, ...service.env }
            });

            // Handle stdout
            child.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message && !message.includes('Warning')) {
                    this.log(service, message.substring(0, 100));
                }
            });

            // Handle stderr
            child.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message && !message.includes('Warning')) {
                    this.log(service, `ERROR: ${message}`, 'error');
                }
            });

            child.on('error', (error) => {
                this.log(service, `Failed to start: ${error.message}`, 'error');
                reject(error);
            });

            child.on('exit', (code) => {
                if (!this.isShuttingDown && code !== 0) {
                    this.log(service, `Exited with code ${code}`, 'error');
                }
            });

            this.processes.push({
                name: service.name,
                process: child,
                port: service.port,
                service
            });

            // Wait for service to start
            setTimeout(() => {
                this.log(service, 'Started successfully', 'success');
                resolve();
            }, 3000);
        });
    }

    async checkHealth(service) {
        const maxRetries = 15;
        const retryDelay = 2000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const url = `http://localhost:${service.port}${service.healthPath}`;
                const response = await axios.get(url, { timeout: 3000 });
                
                if (response.status === 200) {
                    this.log(service, `Health check passed ✓`, 'success');
                    return true;
                }
            } catch (error) {
                if (attempt < maxRetries) {
                    this.log(service, `Health check ${attempt}/${maxRetries}...`);
                    await this.delay(retryDelay);
                }
            }
        }
        
        this.log(service, 'Health check failed ✗', 'error');
        return false;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async startAll() {
        console.log(chalk.bold.blue('\n🚀 Starting FactCheck Platform - Big Data Demo Stack\n'));
        
        // Group services by priority
        const servicesByPriority = {};
        this.services.forEach(service => {
            if (!servicesByPriority[service.priority]) {
                servicesByPriority[service.priority] = [];
            }
            servicesByPriority[service.priority].push(service);
        });

        // Start services by priority groups
        for (const priority of Object.keys(servicesByPriority).sort()) {
            const servicesGroup = servicesByPriority[priority];
            
            console.log(chalk.yellow(`\n📦 Starting Priority ${priority} Services:`));
            servicesGroup.forEach(service => {
                console.log(`   • ${service.name} (${service.port}) - ${service.description}`);
            });
            
            // Start all services in this priority group in parallel
            const startPromises = servicesGroup.map(service => this.startService(service));
            await Promise.all(startPromises);
            
            await this.delay(2000); // Wait between priority groups
        }
        
        console.log(chalk.yellow('\n⏳ Waiting for all services to be ready...\n'));
        await this.delay(10000);
        
        // Check health of all services
        console.log(chalk.yellow('🔍 Performing health checks...\n'));
        const healthPromises = this.services.map(service => this.checkHealth(service));
        const healthResults = await Promise.all(healthPromises);
        
        const healthyCount = healthResults.filter(result => result).length;
        const totalCount = healthResults.length;
        
        console.log(chalk.bold.green(`\n📊 Health Summary: ${healthyCount}/${totalCount} services healthy\n`));
        
        if (healthyCount >= 3) { // At least core services running
            this.printSuccessInfo();
            await this.runDemoTests();
        } else {
            this.printTroubleshooting();
        }
    }

    printSuccessInfo() {
        console.log(chalk.bold.green('🎉 Big Data Demo Stack is running!\n'));
        
        console.log(chalk.bold.blue('📊 Main URLs:'));
        console.log(`   • Frontend:           http://localhost:3000`);
        console.log(`   • Demo Presentation:  http://localhost:3020/demo`);
        console.log(`   • Demo API Status:    http://localhost:3020/api/status`);
        
        console.log(chalk.bold.cyan('\n🔧 Big Data Services:'));
        console.log(`   • Spark Service:      http://localhost:3010/health`);
        console.log(`   • Analytics Service:  http://localhost:3012/health`);
        console.log(`   • ETL Service:        http://localhost:3008/health`);
        
        console.log(chalk.bold.yellow('\n🎮 Demo Commands:'));
        console.log(`   • Test Services:      npm run bigdata:test`);
        console.log(`   • Run All Demos:      npm run demo:all`);
        console.log(`   • Stop All:           npm run stop`);
        
        console.log(chalk.bold.magenta('\n🔗 Infrastructure (if available):'));
        console.log(`   • Spark Master UI:    http://localhost:8080`);
        console.log(`   • Spark History:      http://localhost:8088`);
        console.log(`   • HDFS NameNode:      http://localhost:9870`);
    }

    printTroubleshooting() {
        console.log(chalk.bold.red('\n⚠️  Some services failed to start\n'));
        console.log(chalk.yellow('💡 Troubleshooting tips:'));
        console.log('   • Check if ports are free: netstat -an | findstr "3000 3010 3012"');
        console.log('   • Install dependencies: npm run setup');
        console.log('   • Stop conflicting processes: npm run stop');
        console.log('   • Check logs above for specific errors');
    }

    async runDemoTests() {
        console.log(chalk.bold.blue('\n🧪 Running Quick Demo Tests...\n'));
        
        const tests = [
            {
                name: 'Spark Fake News Detection',
                url: 'http://localhost:3010/api/v1/jobs',
                method: 'POST',
                data: {
                    type: 'fake-news-detection',
                    data: { articles: [{ id: 'demo1', content: 'Test article for demo' }] }
                }
            },
            {
                name: 'Analytics Dashboard',
                url: 'http://localhost:3012/api/v1/dashboard/overview',
                method: 'GET'
            },
            {
                name: 'Demo Server Status',
                url: 'http://localhost:3020/api/status',
                method: 'GET'
            }
        ];

        for (const test of tests) {
            try {
                const options = {
                    method: test.method,
                    url: test.url,
                    timeout: 5000
                };
                
                if (test.data) {
                    options.data = test.data;
                    options.headers = { 'Content-Type': 'application/json' };
                }
                
                const response = await axios(options);
                console.log(`✅ ${test.name}: ${response.status} - Success`);
                
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
        
        console.log(chalk.bold.green('\n🎯 Demo tests completed!'));
        console.log(chalk.yellow('🛑 Press Ctrl+C to stop all services\n'));
    }

    setupGracefulShutdown() {
        const shutdown = () => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            
            console.log(chalk.bold.red('\n🛑 Shutting down Big Data Demo Stack...\n'));
            
            this.processes.forEach(({ name, process, service }) => {
                this.log(service, 'Stopping...', 'error');
                process.kill('SIGTERM');
            });
            
            setTimeout(() => {
                console.log(chalk.bold.green('✅ All services stopped\n'));
                process.exit(0);
            }, 5000);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const starter = new BigDataDemoStarter();
    starter.setupGracefulShutdown();
    starter.startAll().catch(console.error);
}

export default BigDataDemoStarter;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
r();
    starter.setupGracefulShutdown();
    starter.startAll().catch(console.error);
}

export default BigDataDemoStarter;