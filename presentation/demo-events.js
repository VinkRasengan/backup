/**
 * Demo Events for Event-Driven Architecture Presentation
 * Various event types to showcase the system capabilities
 */

const axios = require('axios');

const EVENT_BUS_URL = 'http://localhost:3009/events';

// Demo event samples
const demoEvents = {
  // 1. Simple test event
  simple: {
    type: 'test.simple',
    data: {
      message: 'Hello Event-Driven Architecture!',
      timestamp: new Date().toISOString(),
      demoId: 'demo-001'
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'demo-client',
      version: '1.0.0'
    }
  },

  // 2. User registration event
  userRegistration: {
    type: 'auth.user.registered',
    data: {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'demo@factcheck.com',
      name: 'Demo User',
      roles: ['user'],
      provider: 'email',
      emailVerified: false
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'auth-service',
      version: '1.0.0'
    }
  },

  // 3. User login event
  userLogin: {
    type: 'auth.user.login',
    data: {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'demo@factcheck.com',
      sessionId: 'sess_' + Date.now(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Demo Browser)'
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'auth-service',
      version: '1.0.0'
    }
  },

  // 4. Community post creation
  postCreated: {
    type: 'community.post.created',
    data: {
      postId: '456e7890-e89b-12d3-a456-426614174001',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Breaking: New Fact-Check Results on Climate Change',
      content: 'Our latest analysis reveals important findings about climate change claims circulating on social media...',
      tags: ['climate-change', 'fact-check', 'science'],
      links: ['https://example.com/climate-source', 'https://example.com/research-paper']
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'community-service',
      version: '1.0.0'
    }
  },

  // 5. Comment creation
  commentCreated: {
    type: 'community.comment.created',
    data: {
      commentId: '789e1234-e89b-12d3-a456-426614174002',
      postId: '456e7890-e89b-12d3-a456-426614174001',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Great analysis! This really helps clarify the misinformation.',
      parentCommentId: null
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'community-service',
      version: '1.0.0'
    }
  },

  // 6. Link analysis request
  linkAnalysisRequest: {
    type: 'link.analysis.requested',
    data: {
      linkId: 'abc1234-e89b-12d3-a456-426614174003',
      url: 'https://suspicious-news-site.com/fake-article',
      requestedBy: '123e4567-e89b-12d3-a456-426614174000',
      context: {
        type: 'community_post',
        entityId: '456e7890-e89b-12d3-a456-426614174001'
      },
      priority: 'high',
      analysisType: ['security', 'phishing', 'reputation', 'content']
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'link-service',
      version: '1.0.0'
    }
  },

  // 7. Link analysis completed
  linkAnalysisCompleted: {
    type: 'link.analysis.completed',
    data: {
      linkId: 'abc1234-e89b-12d3-a456-426614174003',
      url: 'https://suspicious-news-site.com/fake-article',
      results: {
        security: {
          score: 25,
          threats: ['malware', 'phishing'],
          safe: false
        },
        reputation: {
          score: 15,
          sources: ['blacklist-db', 'community-reports'],
          trustworthy: false
        },
        content: {
          score: 30,
          factCheck: 'mostly-false',
          sources: ['fact-check-org']
        }
      },
      overallScore: 23,
      recommendation: 'block'
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'link-service',
      version: '1.0.0'
    }
  }
};

// Function to publish a single event
async function publishEvent(eventName, event) {
  try {
    console.log(`\n🚀 Publishing ${eventName} event...`);
    console.log('📤 Event data:', JSON.stringify(event, null, 2));
    
    const response = await axios.post(EVENT_BUS_URL, event, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': 'demo-client'
      }
    });
    
    console.log('✅ Event published successfully!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error publishing ${eventName} event:`, error.response?.data || error.message);
    return null;
  }
}

// Function to run demo sequence
async function runDemoSequence() {
  console.log('🎬 Starting Event-Driven Architecture Demo...\n');
  
  const events = [
    ['simple', demoEvents.simple],
    ['userRegistration', demoEvents.userRegistration],
    ['userLogin', demoEvents.userLogin],
    ['postCreated', demoEvents.postCreated],
    ['commentCreated', demoEvents.commentCreated],
    ['linkAnalysisRequest', demoEvents.linkAnalysisRequest],
    ['linkAnalysisCompleted', demoEvents.linkAnalysisCompleted]
  ];
  
  for (const [eventName, event] of events) {
    await publishEvent(eventName, event);
    
    // Wait 2 seconds between events for demo effect
    console.log('⏳ Waiting 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎉 Demo sequence completed!');
  
  // Show metrics
  try {
    console.log('\n📊 Checking Event Bus metrics...');
    const metricsResponse = await axios.get('http://localhost:3009/metrics');
    console.log('✅ Metrics endpoint working!');
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
  }
}

// Function to publish specific event type
async function publishSpecificEvent(eventType) {
  if (!demoEvents[eventType]) {
    console.error(`❌ Unknown event type: ${eventType}`);
    console.log('Available events:', Object.keys(demoEvents).join(', '));
    return;
  }
  
  await publishEvent(eventType, demoEvents[eventType]);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run full demo sequence
    runDemoSequence().then(() => {
      process.exit(0);
    }).catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
  } else {
    // Publish specific event
    const eventType = args[0];
    publishSpecificEvent(eventType).then(() => {
      process.exit(0);
    }).catch(error => {
      console.error('Event publishing failed:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  demoEvents,
  publishEvent,
  runDemoSequence,
  publishSpecificEvent
};
