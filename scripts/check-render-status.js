#!/usr/bin/env node

/**
 * Check Render Deployment Status
 * This script checks if the Render deployment is working correctly
 */

const https = require('https');

console.log('🔍 Checking Render Deployment Status');
console.log('====================================');

// Expected Render URLs
const BACKEND_URL = 'https://factcheck-backend.onrender.com';
const FRONTEND_URL = 'https://factcheck-frontend.onrender.com';

// Test endpoints
const endpoints = [
    {
        name: 'Backend Health Check',
        url: `${BACKEND_URL}/health`,
        expected: 'status'
    },
    {
        name: 'Backend API Health',
        url: `${BACKEND_URL}/api/health`,
        expected: 'status'
    },
    {
        name: 'Community Posts API',
        url: `${BACKEND_URL}/api/community/posts`,
        expected: 'success'
    },
    {
        name: 'Community Stats API',
        url: `${BACKEND_URL}/api/community/stats`,
        expected: 'success'
    },
    {
        name: 'Frontend Homepage',
        url: FRONTEND_URL,
        expected: 'html'
    }
];

async function checkEndpoint(endpoint) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const req = https.get(endpoint.url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                const status = res.statusCode;
                
                let result = {
                    name: endpoint.name,
                    url: endpoint.url,
                    status: status,
                    responseTime: responseTime,
                    success: false,
                    data: data.substring(0, 200) // First 200 chars
                };
                
                if (status === 200) {
                    if (endpoint.expected === 'html' && data.includes('<html')) {
                        result.success = true;
                    } else if (endpoint.expected === 'status' && data.includes('"status"')) {
                        result.success = true;
                    } else if (endpoint.expected === 'success' && data.includes('"success"')) {
                        result.success = true;
                    }
                }
                
                resolve(result);
            });
        });
        
        req.on('error', (error) => {
            resolve({
                name: endpoint.name,
                url: endpoint.url,
                status: 'ERROR',
                responseTime: Date.now() - startTime,
                success: false,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                name: endpoint.name,
                url: endpoint.url,
                status: 'TIMEOUT',
                responseTime: 10000,
                success: false,
                error: 'Request timeout'
            });
        });
    });
}

async function checkAllEndpoints() {
    console.log('🧪 Testing endpoints...\n');
    
    const results = [];
    
    for (const endpoint of endpoints) {
        console.log(`⏳ Testing: ${endpoint.name}`);
        const result = await checkEndpoint(endpoint);
        results.push(result);
        
        const statusIcon = result.success ? '✅' : '❌';
        const statusText = result.success ? 'OK' : 'FAILED';
        
        console.log(`${statusIcon} ${result.name}: ${statusText} (${result.status}) - ${result.responseTime}ms`);
        
        if (!result.success && result.error) {
            console.log(`   Error: ${result.error}`);
        }
        
        if (!result.success && result.data) {
            console.log(`   Response: ${result.data.substring(0, 100)}...`);
        }
        
        console.log('');
    }
    
    return results;
}

async function generateReport(results) {
    console.log('\n📊 Deployment Status Report');
    console.log('============================');
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = Math.round((successful / total) * 100);
    
    console.log(`✅ Success Rate: ${successful}/${total} (${successRate}%)`);
    console.log(`⏱️  Average Response Time: ${Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / total)}ms`);
    
    if (successRate < 100) {
        console.log('\n🚨 Issues Found:');
        results.filter(r => !r.success).forEach(result => {
            console.log(`❌ ${result.name}: ${result.error || result.status}`);
        });
        
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('1. Check Render Dashboard: https://dashboard.render.com');
        console.log('2. Verify services are deployed and running');
        console.log('3. Check environment variables are set');
        console.log('4. Review deployment logs for errors');
        console.log('5. Ensure auto-deploy is enabled from GitHub');
        
        console.log('\n📋 Manual Deployment Steps:');
        console.log('1. Go to https://dashboard.render.com');
        console.log('2. Create PostgreSQL database: factcheck-db');
        console.log('3. Create Web Service for backend (server folder)');
        console.log('4. Create Static Site for frontend (client folder)');
        console.log('5. Set environment variables as per DEPLOY_TO_RENDER.md');
    } else {
        console.log('\n🎉 All systems operational!');
        console.log(`Frontend: ${FRONTEND_URL}`);
        console.log(`Backend: ${BACKEND_URL}`);
        console.log(`Community: ${FRONTEND_URL}/community`);
    }
    
    console.log('\n📚 Documentation:');
    console.log('- Deployment Guide: DEPLOY_TO_RENDER.md');
    console.log('- Configuration: render.yaml');
    console.log('- Troubleshooting: RENDER_DEPLOYMENT.md');
}

// Run the checks
checkAllEndpoints()
    .then(generateReport)
    .catch(error => {
        console.error('❌ Status check failed:', error);
        process.exit(1);
    });
