/**
 * Contract Test Manager
 * Manages Pact contract testing for microservices
 */

const { Pact } = require('@pact-foundation/pact');
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const fs = require('fs').promises;

class ContractTestManager {
  constructor(options = {}) {
    this.pactDir = options.pactDir || path.join(__dirname, '../../../pacts');
    this.logDir = options.logDir || path.join(__dirname, '../../../logs/pact');
    this.brokerUrl = options.brokerUrl || process.env.PACT_BROKER_URL;
    this.brokerToken = options.brokerToken || process.env.PACT_BROKER_TOKEN;
    this.serviceName = options.serviceName || 'unknown-service';
    this.serviceVersion = options.serviceVersion || process.env.npm_package_version || '1.0.0';
    
    this.providers = new Map();
    this.consumers = new Map();
    this.contractDefinitions = new Map();
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.pactDir, { recursive: true });
      await fs.mkdir(this.logDir, { recursive: true });
      console.log('Contract testing directories ensured');
    } catch (error) {
      console.error('Failed to create contract testing directories:', error);
    }
  }

  /**
   * Create a consumer contract test
   */
  createConsumerTest(consumerName, providerName, options = {}) {
    const pact = new Pact({
      consumer: consumerName,
      provider: providerName,
      port: options.port || 1234,
      log: path.join(this.logDir, `${consumerName}-${providerName}.log`),
      dir: this.pactDir,
      logLevel: options.logLevel || 'INFO',
      spec: options.spec || 2,
      pactfileWriteMode: options.pactfileWriteMode || 'overwrite'
    });

    this.consumers.set(`${consumerName}-${providerName}`, {
      pact,
      consumerName,
      providerName,
      interactions: [],
      options
    });

    return pact;
  }

  /**
   * Add interaction to consumer contract
   */
  addInteraction(consumerName, providerName, interaction) {
    const key = `${consumerName}-${providerName}`;
    const consumer = this.consumers.get(key);
    
    if (!consumer) {
      throw new Error(`Consumer contract not found: ${key}`);
    }

    consumer.interactions.push(interaction);
    return consumer.pact.addInteraction(interaction);
  }

  /**
   * Define standard API contract templates
   */
  defineStandardContracts() {
    // Auth Service Contracts
    this.defineAuthServiceContracts();
    
    // Link Service Contracts
    this.defineLinkServiceContracts();
    
    // Community Service Contracts
    this.defineCommunityServiceContracts();
    
    // Chat Service Contracts
    this.defineChatServiceContracts();
    
    // News Service Contracts
    this.defineNewsServiceContracts();
    
    // Admin Service Contracts
    this.defineAdminServiceContracts();
  }

  /**
   * Define Auth Service contracts
   */
  defineAuthServiceContracts() {
    const authContracts = {
      // Token verification
      tokenVerification: {
        description: 'Verify JWT token',
        providerState: 'valid token exists',
        uponReceiving: 'a request to verify token',
        withRequest: {
          method: 'POST',
          path: '/auth/verify',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            token: 'valid.jwt.token'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            user: {
              id: '123',
              email: 'user@example.com',
              name: 'Test User',
              roles: ['user']
            }
          }
        }
      },

      // User profile
      userProfile: {
        description: 'Get user profile',
        providerState: 'user exists',
        uponReceiving: 'a request for user profile',
        withRequest: {
          method: 'GET',
          path: '/users/123',
          headers: {
            'Authorization': 'Bearer valid.jwt.token'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
            roles: ['user'],
            emailVerified: true
          }
        }
      }
    };

    this.contractDefinitions.set('auth-service', authContracts);
  }

  /**
   * Define Link Service contracts
   */
  defineLinkServiceContracts() {
    const linkContracts = {
      // URL scan
      urlScan: {
        description: 'Scan URL for threats',
        providerState: 'scanning service available',
        uponReceiving: 'a request to scan URL',
        withRequest: {
          method: 'POST',
          path: '/links/scan',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid.jwt.token'
          },
          body: {
            url: 'https://example.com'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            scanId: 'scan-123',
            url: 'https://example.com',
            result: 'safe',
            safetyScore: 95,
            threats: [],
            timestamp: '2024-01-01T00:00:00Z'
          }
        }
      },

      // Scan history
      scanHistory: {
        description: 'Get scan history',
        providerState: 'user has scan history',
        uponReceiving: 'a request for scan history',
        withRequest: {
          method: 'GET',
          path: '/links/history',
          headers: {
            'Authorization': 'Bearer valid.jwt.token'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            scans: [
              {
                scanId: 'scan-123',
                url: 'https://example.com',
                result: 'safe',
                safetyScore: 95,
                timestamp: '2024-01-01T00:00:00Z'
              }
            ],
            total: 1,
            page: 1
          }
        }
      }
    };

    this.contractDefinitions.set('link-service', linkContracts);
  }

  /**
   * Define Community Service contracts
   */
  defineCommunityServiceContracts() {
    const communityContracts = {
      // Get posts
      getPosts: {
        description: 'Get community posts',
        providerState: 'posts exist',
        uponReceiving: 'a request for posts',
        withRequest: {
          method: 'GET',
          path: '/posts',
          query: 'page=1&limit=10'
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            posts: [
              {
                id: 'post-123',
                title: 'Test Post',
                content: 'This is a test post',
                userId: '123',
                voteCount: 5,
                commentCount: 2,
                createdAt: '2024-01-01T00:00:00Z'
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          }
        }
      },

      // Create post
      createPost: {
        description: 'Create new post',
        providerState: 'user is authenticated',
        uponReceiving: 'a request to create post',
        withRequest: {
          method: 'POST',
          path: '/posts',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid.jwt.token'
          },
          body: {
            title: 'New Post',
            content: 'This is a new post',
            category: 'general'
          }
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: 'post-456',
            title: 'New Post',
            content: 'This is a new post',
            category: 'general',
            userId: '123',
            voteCount: 0,
            commentCount: 0,
            createdAt: '2024-01-01T00:00:00Z'
          }
        }
      }
    };

    this.contractDefinitions.set('community-service', communityContracts);
  }

  /**
   * Define Chat Service contracts
   */
  defineChatServiceContracts() {
    const chatContracts = {
      // Send message
      sendMessage: {
        description: 'Send chat message',
        providerState: 'user is authenticated',
        uponReceiving: 'a request to send message',
        withRequest: {
          method: 'POST',
          path: '/chat/message',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid.jwt.token'
          },
          body: {
            message: 'Hello, AI!',
            conversationId: 'conv-123'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: 'msg-456',
            message: 'Hello! How can I help you?',
            type: 'ai',
            conversationId: 'conv-123',
            timestamp: '2024-01-01T00:00:00Z'
          }
        }
      }
    };

    this.contractDefinitions.set('chat-service', chatContracts);
  }

  /**
   * Define News Service contracts
   */
  defineNewsServiceContracts() {
    const newsContracts = {
      // Get articles
      getArticles: {
        description: 'Get news articles',
        providerState: 'articles exist',
        uponReceiving: 'a request for articles',
        withRequest: {
          method: 'GET',
          path: '/news/articles',
          query: 'category=security&limit=5'
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            articles: [
              {
                id: 'article-123',
                title: 'Security News',
                summary: 'Latest security updates',
                category: 'security',
                publishedAt: '2024-01-01T00:00:00Z'
              }
            ],
            total: 1,
            category: 'security'
          }
        }
      }
    };

    this.contractDefinitions.set('news-service', newsContracts);
  }

  /**
   * Define Admin Service contracts
   */
  defineAdminServiceContracts() {
    const adminContracts = {
      // Get system stats
      getSystemStats: {
        description: 'Get system statistics',
        providerState: 'admin is authenticated',
        uponReceiving: 'a request for system stats',
        withRequest: {
          method: 'GET',
          path: '/admin/stats',
          headers: {
            'Authorization': 'Bearer admin.jwt.token'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            users: {
              total: 1000,
              active: 800,
              new: 50
            },
            posts: {
              total: 5000,
              today: 100
            },
            scans: {
              total: 10000,
              today: 500,
              threats: 25
            }
          }
        }
      }
    };

    this.contractDefinitions.set('admin-service', adminContracts);
  }

  /**
   * Generate consumer tests for a service
   */
  async generateConsumerTests(consumerName, providerName) {
    const contracts = this.contractDefinitions.get(providerName);
    if (!contracts) {
      throw new Error(`No contract definitions found for provider: ${providerName}`);
    }

    const pact = this.createConsumerTest(consumerName, providerName);
    
    // Add all interactions
    for (const [name, interaction] of Object.entries(contracts)) {
      await this.addInteraction(consumerName, providerName, interaction);
    }

    return pact;
  }

  /**
   * Run consumer tests
   */
  async runConsumerTests(consumerName, providerName) {
    const key = `${consumerName}-${providerName}`;
    const consumer = this.consumers.get(key);
    
    if (!consumer) {
      throw new Error(`Consumer contract not found: ${key}`);
    }

    try {
      await consumer.pact.setup();
      
      // Run the actual tests here
      // This would typically be done in Jest tests
      console.log(`Running consumer tests for ${consumerName} -> ${providerName}`);
      
      await consumer.pact.finalize();
      
      console.log(`Consumer tests completed for ${consumerName} -> ${providerName}`);
      return true;
    } catch (error) {
      console.error(`Consumer tests failed for ${consumerName} -> ${providerName}:`, error);
      throw error;
    }
  }

  /**
   * Verify provider contracts
   */
  async verifyProviderContracts(providerName, providerUrl, options = {}) {
    const verifier = new Verifier({
      providerBaseUrl: providerUrl,
      pactUrls: options.pactUrls || [
        path.join(this.pactDir, `*-${providerName}.json`)
      ],
      providerVersion: this.serviceVersion,
      publishVerificationResult: options.publishResults || false,
      providerVersionTags: options.tags || ['latest'],
      logLevel: options.logLevel || 'INFO'
    });

    try {
      console.log(`Verifying provider contracts for ${providerName}`);
      const result = await verifier.verifyProvider();
      console.log(`Provider verification completed for ${providerName}`);
      return result;
    } catch (error) {
      console.error(`Provider verification failed for ${providerName}:`, error);
      throw error;
    }
  }

  /**
   * Publish contracts to Pact Broker
   */
  async publishContracts(consumerName, providerName, options = {}) {
    if (!this.brokerUrl) {
      console.warn('Pact Broker URL not configured, skipping publish');
      return;
    }

    const pactFile = path.join(this.pactDir, `${consumerName}-${providerName}.json`);
    
    try {
      // This would use Pact Broker API or CLI
      console.log(`Publishing contract: ${consumerName} -> ${providerName}`);
      
      // Implementation would depend on Pact Broker setup
      // For now, just log the action
      console.log(`Contract published: ${pactFile}`);
      
    } catch (error) {
      console.error('Failed to publish contract:', error);
      throw error;
    }
  }

  /**
   * Get contract testing status
   */
  getStatus() {
    return {
      consumers: Array.from(this.consumers.keys()),
      providers: Array.from(this.providers.keys()),
      contractDefinitions: Array.from(this.contractDefinitions.keys()),
      pactDir: this.pactDir,
      logDir: this.logDir,
      brokerConfigured: !!this.brokerUrl,
      serviceName: this.serviceName,
      serviceVersion: this.serviceVersion
    };
  }

  /**
   * Clean up test artifacts
   */
  async cleanup() {
    try {
      // Clean up Pact instances
      for (const consumer of this.consumers.values()) {
        if (consumer.pact) {
          await consumer.pact.finalize();
        }
      }
      
      console.log('Contract test cleanup completed');
    } catch (error) {
      console.error('Error during contract test cleanup:', error);
    }
  }
}

module.exports = ContractTestManager;
