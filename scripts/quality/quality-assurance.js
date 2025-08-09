import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Quality Assurance Script for Microservices Architecture
 * Kiểm tra các đặc tính chất lượng của hệ thống Microservices
 */

const axios = require('axios');
import { exec  } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
    services: [
        { name: 'api-gateway', port: 8080, health: '/health' },
        { name: 'auth-service', port: 3001, health: '/health' },
        { name: 'community-service', port: 3003, health: '/health' },
        { name: 'link-service', port: 3004, health: '/health' },
        { name: 'chat-service', port: 3005, health: '/health' },
        { name: 'news-service', port: 3006, health: '/health' },
        { name: 'admin-service', port: 3007, health: '/health' },
        { name: 'analytics-service', port: 3008, health: '/health' },
        { name: 'etl-service', port: 3009, health: '/health' },
        { name: 'phishtank-service', port: 3010, health: '/health' },
        { name: 'criminalip-service', port: 3011, health: '/health' },
        { name: 'spark-service', port: 3012, health: '/health' },
        { name: 'event-bus-service', port: 3013, health: '/health' }
    ],
    baseUrl: 'http://localhost',
    timeout: 5000,
    retries: 3
};

class QualityAssurance {
    constructor() {
        this.results = {
            functionality: {},
            reliability: {},
            performance: {},
            security: {},
            maintainability: {},
            testability: {}
        };
    }

    async runAllTests() {
        console.log('🚀 Bắt đầu kiểm tra chất lượng hệ thống Microservices...\n');
        
        await this.testFunctionality();
        await this.testReliability();
        await this.testPerformance();
        await this.testSecurity();
        await this.testMaintainability();
        await this.testTestability();
        
        this.generateReport();
    }

    // 1. Functionality Testing
    async testFunctionality() {
        console.log('📋 1. Kiểm tra Functionality...');
        
        for (const service of CONFIG.services) {
            try {
                const response = await axios.get(`${CONFIG.baseUrl}:${service.port}${service.health}`, {
                    timeout: CONFIG.timeout
                });
                
                this.results.functionality[service.name] = {
                    status: 'PASS',
                    responseTime: response.headers['x-response-time'] || 'N/A',
                    statusCode: response.status,
                    data: response.data
                };
                
                console.log(`✅ ${service.name}: Hoạt động bình thường`);
            } catch (error) {
                this.results.functionality[service.name] = {
                    status: 'FAIL',
                    error: error.message,
                    statusCode: error.response?.status || 'N/A'
                };
                console.log(`❌ ${service.name}: Lỗi - ${error.message}`);
            }
        }
    }

    // 2. Reliability Testing
    async testReliability() {
        console.log('\n🛡️ 2. Kiểm tra Reliability...');
        
        for (const service of CONFIG.services) {
            let successCount = 0;
            let totalTests = CONFIG.retries;
            
            for (let i = 0; i < CONFIG.retries; i++) {
                try {
                    await axios.get(`${CONFIG.baseUrl}:${service.port}${service.health}`, {
                        timeout: CONFIG.timeout
                    });
                    successCount++;
                } catch (error) {
                    // Continue testing
                }
            }
            
            const reliability = (successCount / totalTests) * 100;
            this.results.reliability[service.name] = {
                reliability: `${reliability.toFixed(2)}%`,
                successCount,
                totalTests,
                status: reliability >= 80 ? 'PASS' : 'FAIL'
            };
            
            console.log(`📊 ${service.name}: Độ tin cậy ${reliability.toFixed(2)}%`);
        }
    }

    // 3. Performance Testing
    async testPerformance() {
        console.log('\n⚡ 3. Kiểm tra Performance...');
        
        for (const service of CONFIG.services) {
            const startTime = Date.now();
            try {
                const response = await axios.get(`${CONFIG.baseUrl}:${service.port}${service.health}`, {
                    timeout: CONFIG.timeout
                });
                const responseTime = Date.now() - startTime;
                
                this.results.performance[service.name] = {
                    responseTime: `${responseTime}ms`,
                    status: responseTime < 1000 ? 'PASS' : 'SLOW',
                    statusCode: response.status
                };
                
                console.log(`⏱️ ${service.name}: ${responseTime}ms`);
            } catch (error) {
                this.results.performance[service.name] = {
                    responseTime: 'N/A',
                    status: 'FAIL',
                    error: error.message
                };
                console.log(`❌ ${service.name}: Lỗi performance`);
            }
        }
    }

    // 4. Security Testing
    async testSecurity() {
        console.log('\n🔒 4. Kiểm tra Security...');
        
        for (const service of CONFIG.services) {
            const securityChecks = {
                cors: false,
                helmet: false,
                rateLimit: false,
                https: false
            };
            
            try {
                // Test CORS
                const corsResponse = await axios.get(`${CONFIG.baseUrl}:${service.port}${service.health}`, {
                    headers: { 'Origin': 'http://malicious-site.com' }
                });
                securityChecks.cors = corsResponse.headers['access-control-allow-origin'] !== '*';
                
                // Test Security Headers
                const headers = corsResponse.headers;
                securityChecks.helmet = headers['x-content-type-options'] === 'nosniff' ||
                                       headers['x-frame-options'] ||
                                       headers['x-xss-protection'];
                
                this.results.security[service.name] = {
                    cors: securityChecks.cors ? 'PASS' : 'FAIL',
                    helmet: securityChecks.helmet ? 'PASS' : 'FAIL',
                    rateLimit: 'N/A', // Would need specific rate limit testing
                    https: 'N/A', // Would need HTTPS endpoint
                    overall: (securityChecks.cors && securityChecks.helmet) ? 'PASS' : 'FAIL'
                };
                
                console.log(`🔐 ${service.name}: CORS=${securityChecks.cors ? '✅' : '❌'}, Headers=${securityChecks.helmet ? '✅' : '❌'}`);
            } catch (error) {
                this.results.security[service.name] = {
                    cors: 'N/A',
                    helmet: 'N/A',
                    rateLimit: 'N/A',
                    https: 'N/A',
                    overall: 'FAIL',
                    error: error.message
                };
                console.log(`❌ ${service.name}: Lỗi security test`);
            }
        }
    }

    // 5. Maintainability Testing
    async testMaintainability() {
        console.log('\n🔧 5. Kiểm tra Maintainability...');
        
        for (const service of CONFIG.services) {
            const servicePath = path.join(__dirname, '..', 'services', service.name);
            const maintainabilityChecks = {
                hasPackageJson: false,
                hasDockerfile: false,
                hasTests: false,
                hasDocs: false,
                hasLinting: false
            };
            
            try {
                // Check for package.json
                maintainabilityChecks.hasPackageJson = fs.existsSync(path.join(servicePath, 'package.json'));
                
                // Check for Dockerfile
                maintainabilityChecks.hasDockerfile = fs.existsSync(path.join(servicePath, 'Dockerfile')) ||
                                                    fs.existsSync(path.join(servicePath, 'Dockerfile.render'));
                
                // Check for tests
                maintainabilityChecks.hasTests = fs.existsSync(path.join(servicePath, '__tests__')) ||
                                                fs.existsSync(path.join(servicePath, 'tests')) ||
                                                fs.existsSync(path.join(servicePath, 'test'));
                
                // Check for documentation
                maintainabilityChecks.hasDocs = fs.existsSync(path.join(servicePath, 'README.md')) ||
                                               fs.existsSync(path.join(servicePath, 'docs'));
                
                // Check for linting
                const packageJsonPath = path.join(servicePath, 'package.json');
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    maintainabilityChecks.hasLinting = packageJson.scripts && 
                                                     (packageJson.scripts.lint || packageJson.scripts.eslint);
                }
                
                const score = Object.values(maintainabilityChecks).filter(Boolean).length;
                const maxScore = Object.keys(maintainabilityChecks).length;
                
                this.results.maintainability[service.name] = {
                    score: `${score}/${maxScore}`,
                    percentage: `${((score / maxScore) * 100).toFixed(2)}%`,
                    checks: maintainabilityChecks,
                    status: score >= 3 ? 'PASS' : 'NEEDS_IMPROVEMENT'
                };
                
                console.log(`📁 ${service.name}: ${score}/${maxScore} (${((score / maxScore) * 100).toFixed(2)}%)`);
            } catch (error) {
                this.results.maintainability[service.name] = {
                    score: '0/5',
                    percentage: '0%',
                    checks: maintainabilityChecks,
                    status: 'FAIL',
                    error: error.message
                };
                console.log(`❌ ${service.name}: Lỗi maintainability check`);
            }
        }
    }

    // 6. Testability Testing
    async testTestability() {
        console.log('\n🧪 6. Kiểm tra Testability...');
        
        for (const service of CONFIG.services) {
            const servicePath = path.join(__dirname, '..', 'services', service.name);
            const testabilityChecks = {
                hasUnitTests: false,
                hasIntegrationTests: false,
                hasTestScripts: false,
                hasTestConfig: false,
                hasMockData: false
            };
            
            try {
                // Check for unit tests
                testabilityChecks.hasUnitTests = fs.existsSync(path.join(servicePath, '__tests__')) ||
                                                fs.existsSync(path.join(servicePath, 'tests')) ||
                                                fs.existsSync(path.join(servicePath, 'test'));
                
                // Check for integration tests
                testabilityChecks.hasIntegrationTests = fs.existsSync(path.join(servicePath, 'tests', 'integration')) ||
                                                       fs.existsSync(path.join(servicePath, '__tests__', 'integration'));
                
                // Check for test scripts in package.json
                const packageJsonPath = path.join(servicePath, 'package.json');
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    testabilityChecks.hasTestScripts = packageJson.scripts && 
                                                     (packageJson.scripts.test || packageJson.scripts['test:unit']);
                }
                
                // Check for test configuration
                testabilityChecks.hasTestConfig = fs.existsSync(path.join(servicePath, 'jest.config.js')) ||
                                                 fs.existsSync(path.join(servicePath, '.jestrc')) ||
                                                 fs.existsSync(path.join(servicePath, 'test.config.js'));
                
                // Check for mock data
                testabilityChecks.hasMockData = fs.existsSync(path.join(servicePath, '__mocks__')) ||
                                               fs.existsSync(path.join(servicePath, 'mocks')) ||
                                               fs.existsSync(path.join(servicePath, 'test', 'mocks'));
                
                const score = Object.values(testabilityChecks).filter(Boolean).length;
                const maxScore = Object.keys(testabilityChecks).length;
                
                this.results.testability[service.name] = {
                    score: `${score}/${maxScore}`,
                    percentage: `${((score / maxScore) * 100).toFixed(2)}%`,
                    checks: testabilityChecks,
                    status: score >= 3 ? 'PASS' : 'NEEDS_IMPROVEMENT'
                };
                
                console.log(`🧪 ${service.name}: ${score}/${maxScore} (${((score / maxScore) * 100).toFixed(2)}%)`);
            } catch (error) {
                this.results.testability[service.name] = {
                    score: '0/5',
                    percentage: '0%',
                    checks: testabilityChecks,
                    status: 'FAIL',
                    error: error.message
                };
                console.log(`❌ ${service.name}: Lỗi testability check`);
            }
        }
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n📊 ========================================');
        console.log('📊 BÁO CÁO CHẤT LƯỢNG MICROSERVICES');
        console.log('📊 ========================================\n');

        // Functionality Summary
        console.log('1. FUNCTIONALITY:');
        const functionalityPass = Object.values(this.results.functionality).filter(r => r.status === 'PASS').length;
        const functionalityTotal = Object.keys(this.results.functionality).length;
        console.log(`   ✅ Pass: ${functionalityPass}/${functionalityTotal} (${((functionalityPass/functionalityTotal)*100).toFixed(2)}%)`);

        // Reliability Summary
        console.log('\n2. RELIABILITY:');
        const reliabilityPass = Object.values(this.results.reliability).filter(r => r.status === 'PASS').length;
        const reliabilityTotal = Object.keys(this.results.reliability).length;
        console.log(`   ✅ Pass: ${reliabilityPass}/${reliabilityTotal} (${((reliabilityPass/reliabilityTotal)*100).toFixed(2)}%)`);

        // Performance Summary
        console.log('\n3. PERFORMANCE:');
        const performancePass = Object.values(this.results.performance).filter(r => r.status === 'PASS').length;
        const performanceTotal = Object.keys(this.results.performance).length;
        console.log(`   ✅ Pass: ${performancePass}/${performanceTotal} (${((performancePass/performanceTotal)*100).toFixed(2)}%)`);

        // Security Summary
        console.log('\n4. SECURITY:');
        const securityPass = Object.values(this.results.security).filter(r => r.overall === 'PASS').length;
        const securityTotal = Object.keys(this.results.security).length;
        console.log(`   ✅ Pass: ${securityPass}/${securityTotal} (${((securityPass/securityTotal)*100).toFixed(2)}%)`);

        // Maintainability Summary
        console.log('\n5. MAINTAINABILITY:');
        const maintainabilityPass = Object.values(this.results.maintainability).filter(r => r.status === 'PASS').length;
        const maintainabilityTotal = Object.keys(this.results.maintainability).length;
        console.log(`   ✅ Pass: ${maintainabilityPass}/${maintainabilityTotal} (${((maintainabilityPass/maintainabilityTotal)*100).toFixed(2)}%)`);

        // Testability Summary
        console.log('\n6. TESTABILITY:');
        const testabilityPass = Object.values(this.results.testability).filter(r => r.status === 'PASS').length;
        const testabilityTotal = Object.keys(this.results.testability).length;
        console.log(`   ✅ Pass: ${testabilityPass}/${testabilityTotal} (${((testabilityPass/testabilityTotal)*100).toFixed(2)}%)`);

        // Overall Score
        const totalPass = functionalityPass + reliabilityPass + performancePass + securityPass + maintainabilityPass + testabilityPass;
        const totalTests = functionalityTotal + reliabilityTotal + performanceTotal + securityTotal + maintainabilityTotal + testabilityTotal;
        const overallScore = ((totalPass / totalTests) * 100).toFixed(2);

        console.log('\n🎯 OVERALL SCORE:');
        console.log(`   📈 ${overallScore}% (${totalPass}/${totalTests} tests passed)`);

        if (overallScore >= 80) {
            console.log('   🎉 EXCELLENT: Hệ thống đạt chất lượng cao!');
        } else if (overallScore >= 60) {
            console.log('   ✅ GOOD: Hệ thống đạt yêu cầu cơ bản!');
        } else {
            console.log('   ⚠️ NEEDS IMPROVEMENT: Cần cải thiện chất lượng!');
        }

        // Save detailed report to file
        const reportPath = path.join(__dirname, '..', 'docs', 'quality-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Báo cáo chi tiết đã được lưu tại: ${reportPath}`);
    }
}

// Run the quality assurance tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const qa = new QualityAssurance();
    qa.runAllTests().catch(console.error);
}

export default QualityAssurance; 