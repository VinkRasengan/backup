#!/usr/bin/env node

/**
 * Event Sourcing Monitoring Dashboard
 * Real-time monitoring and analytics for event sourcing system
 */

require('dotenv').config();

class EventSourcingMonitor {
  constructor() {
    this.services = new Map();
    this.eventStats = {
      total: 0,
      byService: {},
      byType: {},
      byHour: {},
      errors: 0
    };
    this.isRunning = false;
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🔧 Initializing Event Sourcing Monitor...');
    
    try {
      // Initialize all event handlers
      const AuthEventHandler = require('./services/auth-service/src/events/authEventHandler');
      const CommunityEventHandler = require('./services/community-service/src/events/communityEventHandler');
      const LinkEventHandler = require('./services/link-service/src/events/linkEventHandler');
      
      const authHandler = new AuthEventHandler();
      const communityHandler = new CommunityEventHandler();
      const linkHandler = new LinkEventHandler();
      
      this.services.set('auth', authHandler);
      this.services.set('community', communityHandler);
      this.services.set('link', linkHandler);
      
      // Wait for connections
      for (const [name, handler] of this.services) {
        await this.waitForConnection(name, handler);
      }
      
      console.log('✅ All services connected to Event Sourcing Monitor');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize monitor:', error.message);
      return false;
    }
  }

  async waitForConnection(serviceName, handler) {
    return new Promise((resolve) => {
      if (handler.eventBus.isConnected) {
        console.log(`✅ ${serviceName} service connected`);
        resolve();
        return;
      }
      
      handler.eventBus.on('connected', () => {
        console.log(`✅ ${serviceName} service connected`);
        resolve();
      });
      
      setTimeout(() => {
        console.log(`⚠️ ${serviceName} service connection timeout, continuing with mock`);
        resolve();
      }, 2000);
    });
  }

  async startMonitoring() {
    if (this.isRunning) {
      console.log('⚠️ Monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Event Sourcing Monitor...');
    console.log('=' .repeat(80));
    
    // Start monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.displayDashboard();
    }, 5000); // Update every 5 seconds
    
    // Generate sample events for demonstration
    this.startEventGeneration();
    
    console.log('📊 Monitor started. Press Ctrl+C to stop.');
  }

  async collectMetrics() {
    this.eventStats.total = 0;
    this.eventStats.byService = {};
    
    for (const [serviceName, handler] of this.services) {
      try {
        const status = handler.getStatus();
        const health = await handler.healthCheck();
        const mockEvents = handler.eventBus.getMockEvents();
        
        this.eventStats.byService[serviceName] = {
          status: health.status,
          mode: health.mode || 'unknown',
          connected: status.connected,
          eventsCount: mockEvents.length,
          subscriptions: status.mockSubscriptionsCount || 0,
          lastEventTime: mockEvents.length > 0 ? mockEvents[mockEvents.length - 1].timestamp : null
        };
        
        this.eventStats.total += mockEvents.length;
        
        // Count events by type
        mockEvents.forEach(event => {
          const eventType = event.type.split(':')[0]; // Get prefix (auth, community, link)
          this.eventStats.byType[eventType] = (this.eventStats.byType[eventType] || 0) + 1;
        });
        
      } catch (error) {
        this.eventStats.errors++;
        console.error(`Error collecting metrics for ${serviceName}:`, error.message);
      }
    }
  }

  displayDashboard() {
    // Clear console
    console.clear();
    
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`;
    
    console.log('🔍 EVENT SOURCING MONITORING DASHBOARD');
    console.log('=' .repeat(80));
    console.log(`⏱️  Uptime: ${uptimeStr} | 📊 Total Events: ${this.eventStats.total} | ❌ Errors: ${this.eventStats.errors}`);
    console.log('=' .repeat(80));
    
    // Service Status
    console.log('\n📋 SERVICE STATUS:');
    console.log('-'.repeat(80));
    console.log('Service'.padEnd(15) + 'Status'.padEnd(12) + 'Mode'.padEnd(10) + 'Events'.padEnd(10) + 'Subs'.padEnd(8) + 'Last Event');
    console.log('-'.repeat(80));
    
    for (const [serviceName, stats] of Object.entries(this.eventStats.byService)) {
      const statusIcon = stats.status === 'healthy' ? '✅' : '❌';
      const lastEvent = stats.lastEventTime ? 
        new Date(stats.lastEventTime).toLocaleTimeString() : 'None';
      
      console.log(
        `${statusIcon} ${serviceName}`.padEnd(15) +
        stats.status.padEnd(12) +
        stats.mode.padEnd(10) +
        stats.eventsCount.toString().padEnd(10) +
        stats.subscriptions.toString().padEnd(8) +
        lastEvent
      );
    }
    
    // Event Type Distribution
    console.log('\n📊 EVENT TYPE DISTRIBUTION:');
    console.log('-'.repeat(40));
    for (const [eventType, count] of Object.entries(this.eventStats.byType)) {
      const percentage = this.eventStats.total > 0 ? 
        Math.round((count / this.eventStats.total) * 100) : 0;
      const bar = '█'.repeat(Math.floor(percentage / 5));
      console.log(`${eventType.padEnd(12)} ${count.toString().padEnd(6)} ${percentage}% ${bar}`);
    }
    
    // Recent Events
    console.log('\n📝 RECENT EVENTS (Last 5):');
    console.log('-'.repeat(80));
    
    const allEvents = [];
    for (const [serviceName, handler] of this.services) {
      const events = handler.eventBus.getMockEvents();
      events.forEach(event => {
        allEvents.push({ ...event, service: serviceName });
      });
    }
    
    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    allEvents.slice(0, 5).forEach((event, index) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      const serviceIcon = event.service === 'auth' ? '🔐' : 
                         event.service === 'community' ? '👥' : '🔗';
      console.log(`${index + 1}. ${serviceIcon} ${event.type} (${time})`);
      console.log(`   Source: ${event.source} | ID: ${event.id}`);
    });
    
    if (allEvents.length === 0) {
      console.log('   No events recorded yet...');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Refreshing every 5 seconds... Press Ctrl+C to stop');
  }

  async startEventGeneration() {
    // Generate sample events every 10 seconds for demonstration
    this.eventGenerationInterval = setInterval(async () => {
      try {
        await this.generateSampleEvents();
      } catch (error) {
        console.error('Error generating sample events:', error.message);
        this.eventStats.errors++;
      }
    }, 10000);
  }

  async generateSampleEvents() {
    const authHandler = this.services.get('auth');
    const communityHandler = this.services.get('community');
    const linkHandler = this.services.get('link');
    
    const eventTypes = [
      async () => {
        await authHandler.publishLoginEvent(
          { id: `user-${Date.now()}`, email: 'monitor@example.com', name: 'Monitor User' },
          { ipAddress: '127.0.0.1', userAgent: 'Monitor Agent' }
        );
      },
      async () => {
        await communityHandler.publishPostCreatedEvent({
          id: `post-${Date.now()}`,
          title: 'Monitor Test Post',
          content: 'This is a test post from the monitor',
          author: { uid: 'monitor-user', email: 'monitor@example.com' }
        });
      },
      async () => {
        await linkHandler.publishLinkScanRequestedEvent({
          url: `https://test-${Date.now()}.com`,
          userId: 'monitor-user',
          scanType: 'quick'
        });
      },
      async () => {
        await communityHandler.publishVoteEvent({
          linkId: `post-${Date.now()}`,
          userId: 'monitor-user',
          voteType: 'upvote',
          action: 'created'
        });
      }
    ];
    
    // Randomly select and execute an event
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    await randomEvent();
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.eventGenerationInterval) {
      clearInterval(this.eventGenerationInterval);
    }
    
    console.log('\n🛑 Stopping Event Sourcing Monitor...');
    
    // Disconnect all services
    for (const [serviceName, handler] of this.services) {
      try {
        await handler.disconnect();
        console.log(`✅ ${serviceName} service disconnected`);
      } catch (error) {
        console.error(`❌ Error disconnecting ${serviceName}:`, error.message);
      }
    }
    
    console.log('👋 Event Sourcing Monitor stopped');
  }
}

// Main execution
async function main() {
  const monitor = new EventSourcingMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await monitor.stop();
    process.exit(0);
  });
  
  // Initialize and start monitoring
  const initialized = await monitor.initialize();
  if (initialized) {
    await monitor.startMonitoring();
  } else {
    console.error('❌ Failed to initialize monitor');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Monitor failed:', error);
  process.exit(1);
});
