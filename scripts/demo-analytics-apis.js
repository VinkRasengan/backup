#!/usr/bin/env node

/**
 * Demo Analytics Service APIs
 * Comprehensive test of Analytics dashboard and insights capabilities
 */

const axios = require('axios');
const chalk = require('chalk');

class AnalyticsDemoRunner {
    constructor() {
        this.baseUrl = 'http://localhost:3012';
        this.results = [];
    }

    log(message, type = 'info') {
        const symbols = { info: '🔄', success: '✅', error: '❌', warning: '⚠️' };
        const colors = { info: chalk.blue, success: chalk.green, error: chalk.red, warning: chalk.yellow };
        console.log(`${symbols[type]} ${colors[type](message)}`);
    }

    async runDemo() {
        console.log(chalk.bold.blue('\n📊 Analytics Service Demo - FactCheck Platform\n'));

        // Demo 1: Health Check
        await this.testHealthCheck();
        
        // Demo 2: Dashboard Overview
        await this.testDashboardOverview();
        
        // Demo 3: Dashboard Reports
        await this.testDashboardReports();
        
        // Demo 4: Insights Generation
        await this.testInsightsGeneration();

        this.printSummary();
    }

    async testHealthCheck() {
        this.log('Testing Analytics Service Health...');
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            const data = response.data;
            
            console.log(`   Status: ${data.status}`);
            console.log(`   Duration: ${data.duration}`);
            
            if (data.checks) {
                Object.entries(data.checks).forEach(([check, result]) => {
                    console.log(`   ${check}: ${result.status}`);
                    if (result.error) {
                        console.log(`     Error: ${result.error}`);
                    }
                });
            }
            
            this.results.push({ test: 'Health Check', status: 'success', data });
            this.log('Health check completed', 'success');
        } catch (error) {
            this.log(`Health check failed: ${error.message}`, 'error');
            this.results.push({ test: 'Health Check', status: 'failed', error: error.message });
        }
    }

    async testDashboardOverview() {
        this.log('Testing Dashboard Overview API...');
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/dashboard/overview`);
            const data = response.data.data;
            
            console.log(`   Total Users: ${data.summary.totalUsers}`);
            console.log(`   Total Posts: ${data.summary.totalPosts}`);
            console.log(`   System Uptime: ${data.summary.systemUptime}`);
            console.log(`   Last Updated: ${new Date(data.lastUpdated).toLocaleString()}`);
            
            if (data.stats) {
                console.log(`   Additional Stats Available: ${data.stats.length} metrics`);
            }
            
            this.results.push({ test: 'Dashboard Overview', status: 'success', data });
            this.log('Dashboard overview retrieved', 'success');
        } catch (error) {
            this.log(`Dashboard overview failed: ${error.message}`, 'error');
            this.results.push({ test: 'Dashboard Overview', status: 'failed', error: error.message });
        }
    }

    async testDashboardReports() {
        this.log('Testing Dashboard Reports API...');
        try {
            // Test different report types
            const reportTypes = ['summary', 'trends', 'performance'];
            const reportResults = [];
            
            for (const reportType of reportTypes) {
                try {
                    const response = await axios.get(`${this.baseUrl}/api/v1/dashboard/reports/${reportType}`);
                    reportResults.push({
                        type: reportType,
                        status: 'success',
                        data: response.data
                    });
                    console.log(`   ${reportType} report: Available`);
                } catch (error) {
                    reportResults.push({
                        type: reportType,
                        status: 'failed',
                        error: error.response?.status || error.message
                    });
                    console.log(`   ${reportType} report: ${error.response?.status === 404 ? 'Not implemented' : 'Error'}`);
                }
            }
            
            const successfulReports = reportResults.filter(r => r.status === 'success');
            console.log(`   Available Reports: ${successfulReports.length}/${reportTypes.length}`);
            
            this.results.push({ 
                test: 'Dashboard Reports', 
                status: successfulReports.length > 0 ? 'success' : 'partial',
                data: reportResults 
            });
            
            this.log('Dashboard reports tested', successfulReports.length > 0 ? 'success' : 'warning');
        } catch (error) {
            this.log(`Dashboard reports test failed: ${error.message}`, 'error');
            this.results.push({ test: 'Dashboard Reports', status: 'failed', error: error.message });
        }
    }

    async testInsightsGeneration() {
        this.log('Testing Insights Generation APIs...');
        try {
            // Test different insight types
            const insightTypes = ['user-behavior', 'content-trends', 'system-performance', 'fake-news-patterns'];
            const insightResults = [];
            
            for (const insightType of insightTypes) {
                try {
                    const response = await axios.get(`${this.baseUrl}/api/v1/insights/${insightType}`);
                    insightResults.push({
                        type: insightType,
                        status: 'success',
                        data: response.data
                    });
                    console.log(`   ${insightType}: Generated successfully`);
                } catch (error) {
                    insightResults.push({
                        type: insightType,
                        status: 'failed',
                        error: error.response?.status || error.message
                    });
                    console.log(`   ${insightType}: ${error.response?.status === 404 ? 'Not implemented' : 'Generation failed'}`);
                }
            }
            
            // Test custom insight generation
            try {
                const customInsightData = {
                    type: 'custom-analysis',
                    parameters: {
                        timeRange: '7d',
                        metrics: ['user_engagement', 'content_verification'],
                        filters: {
                            category: 'politics',
                            verified: true
                        }
                    }
                };
                
                const response = await axios.post(`${this.baseUrl}/api/v1/insights/generate`, customInsightData);
                insightResults.push({
                    type: 'custom-analysis',
                    status: 'success',
                    data: response.data
                });
                console.log(`   Custom Analysis: Generated successfully`);
            } catch (error) {
                console.log(`   Custom Analysis: ${error.response?.status === 404 ? 'Not implemented' : 'Generation failed'}`);
            }
            
            const successfulInsights = insightResults.filter(r => r.status === 'success');
            console.log(`   Generated Insights: ${successfulInsights.length}/${insightTypes.length + 1}`);
            
            this.results.push({ 
                test: 'Insights Generation', 
                status: successfulInsights.length > 0 ? 'success' : 'partial',
                data: insightResults 
            });
            
            this.log('Insights generation tested', successfulInsights.length > 0 ? 'success' : 'warning');
        } catch (error) {
            this.log(`Insights generation test failed: ${error.message}`, 'error');
            this.results.push({ test: 'Insights Generation', status: 'failed', error: error.message });
        }
    }

    printSummary() {
        console.log(chalk.bold.blue('\n📊 Analytics Demo Results Summary:\n'));
        
        const successful = this.results.filter(r => r.status === 'success');
        const failed = this.results.filter(r => r.status === 'failed');
        const partial = this.results.filter(r => r.status === 'partial');
        
        console.log(chalk.green(`✅ Successful Tests: ${successful.length}`));
        console.log(chalk.yellow(`⚠️  Partial Tests: ${partial.length}`));
        console.log(chalk.red(`❌ Failed Tests: ${failed.length}`));
        console.log(chalk.blue(`📊 Success Rate: ${Math.round((successful.length / this.results.length) * 100)}%\n`));
        
        if (successful.length > 0) {
            console.log(chalk.bold.green('🎯 Key Achievements:'));
            successful.forEach(result => {
                console.log(`   • ${result.test}: ${this.getAchievementSummary(result)}`);
            });
        }
        
        if (partial.length > 0) {
            console.log(chalk.bold.yellow('\n⚠️  Partial Results:'));
            partial.forEach(result => {
                console.log(`   • ${result.test}: Some features working`);
            });
        }
        
        if (failed.length > 0) {
            console.log(chalk.bold.red('\n❌ Failed Tests:'));
            failed.forEach(result => {
                console.log(`   • ${result.test}: ${result.error}`);
            });
        }
        
        console.log(chalk.bold.blue('\n🔗 Analytics Service Endpoints:'));
        console.log(`   • Health Check: GET ${this.baseUrl}/health`);
        console.log(`   • Dashboard Overview: GET ${this.baseUrl}/api/v1/dashboard/overview`);
        console.log(`   • Dashboard Reports: GET ${this.baseUrl}/api/v1/dashboard/reports/{type}`);
        console.log(`   • Generate Insights: GET ${this.baseUrl}/api/v1/insights/{type}`);
        console.log(`   • Custom Analysis: POST ${this.baseUrl}/api/v1/insights/generate`);
        
        // Print sample data
        const overviewResult = this.results.find(r => r.test === 'Dashboard Overview' && r.status === 'success');
        if (overviewResult && overviewResult.data) {
            console.log(chalk.bold.green('\n📈 Live Data Sample:'));
            const summary = overviewResult.data.summary;
            console.log(`   • Active Users: ${summary.totalUsers}`);
            console.log(`   • Content Items: ${summary.totalPosts}`);
            console.log(`   • System Health: ${summary.systemUptime}`);
        }
    }

    getAchievementSummary(result) {
        if (result.test === 'Dashboard Overview' && result.data.summary) {
            return `${result.data.summary.totalUsers} users, ${result.data.summary.totalPosts} posts tracked`;
        }
        if (result.test === 'Dashboard Reports' && result.data) {
            const successful = result.data.filter(r => r.status === 'success');
            return `${successful.length} report types available`;
        }
        if (result.test === 'Insights Generation' && result.data) {
            const successful = result.data.filter(r => r.status === 'success');
            return `${successful.length} insight types generated`;
        }
        return 'Completed successfully';
    }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const demo = new AnalyticsDemoRunner();
    demo.runDemo().catch(console.error);
}

export default AnalyticsDemoRunner;