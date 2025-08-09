#!/usr/bin/env node

/**
 * Comprehensive Event-Driven Architecture Test Report
 * Tests all aspects of the Event-Driven system
 */

const axios = require('axios');
import fs from 'fs';

class EventDrivenTestReport {
  constructor() {
    this.eventBusUrl = 'http://localhost:3007';
    this.services = {
      'auth': 'http://localhost:3001',
      'community': 'http://localhost:3003',
      'link': 'http://localhost:3002',
      'chat': 'http://localhost:3004',
      'news': 'http://localhost:3005',
      'admin': 'http://localhost:3006',
      'gateway': 'http://localhost:8080',
      'frontend': 'http://localhost:3000'
    };
    this.results = {};
  }

  async testInfrastructure() {
    console.log('🏗️  Testing Infrastructure...');
    const results = {};

    // Test Event Bus Service
    try {
      const response = await axios.get(`${this.eventBusUrl}/health`);
      results.eventBus = {
        status: 'healthy',
        mode: response.data.eventStore?.mode || 'unknown',
        uptime: response.data.uptime || 0,
        memory: response.data.memory?.heapUsed || 0
      };
      console.log('✅ Event Bus Service: healthy');
    } catch (error) {
      results.eventBus = { status: 'unhealthy', error: error.message };
      console.log('❌ Event Bus Service: unhealthy');
    }

    // Test Event Store
    try {
      const response = await axios.get(`${this.eventBusUrl}/api/eventstore/stats`);
      results.eventStore = {
        status: 'healthy',
        eventsAppended: response.data.data.eventsAppended,
        eventsRead: response.data.data.eventsRead,
        mode: response.data.data.mode,
        connected: response.data.data.isConnected
      };
      console.log('✅ Event Store: healthy');
    } catch (error) {
      results.eventStore = { status: 'unhealthy', error: error.message };
      console.log('❌ Event Store: unhealthy');
    }

    return results;
  }

  async testEventOperations() {
    console.log('\n📤 Testing Event Operations...');
    const results = {};

    // Test Event Publishing
    try {
      const testEvent = {
        type: 'test.comprehensive.event',
        data: {
          message: 'Comprehensive test event',
          timestamp: new Date().toISOString(),
          testId: Math.random().toString(36).substr(2, 9)
        },
        metadata: {
          source: 'comprehensive-test',
          version: '1.0.0'
        }
      };

      const response = await axios.post(`${this.eventBusUrl}/events`, testEvent);
      results.eventPublishing = {
        status: 'success',
        eventId: response.data.eventId,
        published: response.data.published
      };
      console.log('✅ Event Publishing: success');
    } catch (error) {
      results.eventPublishing = { status: 'failed', error: error.message };
      console.log('❌ Event Publishing: failed');
    }

    // Test Event Store API
    try {
      const streamName = 'comprehensive-test-' + Date.now();
      const storeEvent = {
        eventType: 'test.store.event',
        eventData: { message: 'Store test event' },
        metadata: { source: 'comprehensive-test' }
      };

      const appendResponse = await axios.post(`${this.eventBusUrl}/api/eventstore/events/${streamName}`, storeEvent);
      const readResponse = await axios.get(`${this.eventBusUrl}/api/eventstore/events/${streamName}`);

      results.eventStoreAPI = {
        status: 'success',
        streamName: streamName,
        eventId: appendResponse.data.data?.eventId,
        eventsRead: readResponse.data.data?.eventCount || 0
      };
      console.log('✅ Event Store API: success');
    } catch (error) {
      results.eventStoreAPI = { status: 'failed', error: error.message };
      console.log('❌ Event Store API: failed');
    }

    return results;
  }

  async testServiceIntegration() {
    console.log('\n🔗 Testing Service Integration...');
    const results = {};

    for (const [name, url] of Object.entries(this.services)) {
      try {
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        results[name] = {
          status: 'healthy',
          eventDriven: response.data.eventDriven || false,
          eventBusConnected: response.data.checks?.eventBus?.result?.connected || false,
          uptime: response.data.uptime || response.data.checks?.uptime?.result?.uptime || 'unknown',
          version: response.data.version || 'unknown'
        };
        console.log(`✅ ${name.toUpperCase()}: healthy (Event-Driven: ${results[name].eventDriven})`);
      } catch (error) {
        results[name] = { status: 'unhealthy', error: error.message };
        console.log(`❌ ${name.toUpperCase()}: unhealthy`);
      }
    }

    return results;
  }

  async testEventSchemas() {
    console.log('\n📋 Testing Event Schemas...');
    const results = {};

    // Test different event types
    const eventTypes = [
      {
        type: 'auth.user.login',
        data: {
          userId: 'test-user-123',
          email: 'test@example.com',
          sessionId: 'session-123',
          timestamp: new Date().toISOString()
        }
      },
      {
        type: 'community.post.created',
        data: {
          postId: 'post-123',
          authorId: 'user-123',
          title: 'Test Post',
          content: 'Test content',
          timestamp: new Date().toISOString()
        }
      },
      {
        type: 'link.submitted',
        data: {
          linkId: 'link-123',
          url: 'https://example.com',
          submitterId: 'user-123',
          timestamp: new Date().toISOString()
        }
      }
    ];

    for (const eventType of eventTypes) {
      try {
        const response = await axios.post(`${this.eventBusUrl}/events`, {
          type: eventType.type,
          data: eventType.data,
          metadata: { source: 'schema-test' }
        });

        results[eventType.type] = {
          status: 'success',
          eventId: response.data.eventId
        };
        console.log(`✅ ${eventType.type}: valid`);
      } catch (error) {
        results[eventType.type] = {
          status: 'failed',
          error: error.message
        };
        console.log(`❌ ${eventType.type}: invalid`);
      }
    }

    return results;
  }

  async generateReport() {
    console.log('🚀 Comprehensive Event-Driven Architecture Test');
    console.log('================================================\n');

    this.results = {
      timestamp: new Date().toISOString(),
      infrastructure: await this.testInfrastructure(),
      eventOperations: await this.testEventOperations(),
      serviceIntegration: await this.testServiceIntegration(),
      eventSchemas: await this.testEventSchemas()
    };

    // Calculate overall statistics
    const stats = this.calculateStats();
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`🕐 Test Duration: ${stats.duration}ms`);
    console.log(`✅ Tests Passed: ${stats.passed}/${stats.total}`);
    console.log(`📊 Success Rate: ${stats.successRate}%`);
    console.log(`🏗️  Infrastructure Health: ${stats.infrastructureHealth}`);
    console.log(`🔗 Service Integration: ${stats.serviceIntegration}`);
    console.log(`📤 Event Operations: ${stats.eventOperations}`);

    // Save detailed report
    await this.saveReport();

    if (stats.successRate >= 80) {
      console.log('\n🎉 Event-Driven Architecture is working well!');
    } else if (stats.successRate >= 60) {
      console.log('\n⚠️  Event-Driven Architecture has some issues but is functional.');
    } else {
      console.log('\n❌ Event-Driven Architecture has significant issues.');
    }

    return this.results;
  }

  calculateStats() {
    const startTime = Date.now();
    let passed = 0;
    let total = 0;

    // Count infrastructure tests
    Object.values(this.results.infrastructure).forEach(result => {
      total++;
      if (result.status === 'healthy') passed++;
    });

    // Count event operation tests
    Object.values(this.results.eventOperations).forEach(result => {
      total++;
      if (result.status === 'success') passed++;
    });

    // Count service integration tests
    Object.values(this.results.serviceIntegration).forEach(result => {
      total++;
      if (result.status === 'healthy') passed++;
    });

    // Count event schema tests
    Object.values(this.results.eventSchemas).forEach(result => {
      total++;
      if (result.status === 'success') passed++;
    });

    return {
      duration: Date.now() - startTime,
      passed,
      total,
      successRate: Math.round((passed / total) * 100),
      infrastructureHealth: this.getHealthStatus(this.results.infrastructure),
      serviceIntegration: this.getHealthStatus(this.results.serviceIntegration),
      eventOperations: this.getHealthStatus(this.results.eventOperations)
    };
  }

  getHealthStatus(results) {
    const healthy = Object.values(results).filter(r => 
      r.status === 'healthy' || r.status === 'success'
    ).length;
    const total = Object.keys(results).length;
    const percentage = Math.round((healthy / total) * 100);
    
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Poor';
  }

  async saveReport() {
    const reportData = {
      ...this.results,
      summary: this.calculateStats()
    };

    const filename = `event-driven-test-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved: ${filename}`);
  }
}

// Run comprehensive test
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tester = new EventDrivenTestReport();
  tester.generateReport().catch(console.error);
}

export default EventDrivenTestReport;
