/**
 * Third-party API Configuration
 * Centralized configuration for all external security and screenshot APIs
 */

const config = {
  // Screenshot API
  screenshotOne: {
    apiKey: process.env.SCREENSHOTONE_API_KEY,
    secret: process.env.SCREENSHOTONE_SECRET,
    baseUrl: 'https://api.screenshotone.com',
    enabled: !!process.env.SCREENSHOTONE_API_KEY,
    options: {
      format: 'png',
      viewport_width: 1920,
      viewport_height: 1080,
      device_scale_factor: 1,
      full_page: false,
      block_ads: true,
      block_cookie_banners: true,
      block_trackers: true,
      cache: true,
      cache_ttl: 2592000, // 30 days
      delay: 3 // seconds
    }
  },

  // Google Safe Browsing API
  googleSafeBrowsing: {
    apiKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
    baseUrl: 'https://safebrowsing.googleapis.com/v4',
    enabled: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY,
    clientId: 'factcheck-platform',
    clientVersion: '1.0.0',
    threatTypes: [
      'MALWARE',
      'SOCIAL_ENGINEERING',
      'UNWANTED_SOFTWARE',
      'POTENTIALLY_HARMFUL_APPLICATION'
    ],
    platformTypes: ['ANY_PLATFORM'],
    threatEntryTypes: ['URL']
  },

  // PhishTank API (disabled - no registration available)
  phishTank: {
    apiKey: process.env.PHISHTANK_API_KEY,
    baseUrl: 'https://checkurl.phishtank.com',
    enabled: !!process.env.PHISHTANK_API_KEY && !process.env.PHISHTANK_API_KEY.includes('disabled'),
    appKey: process.env.PHISHTANK_API_KEY,
    format: 'json'
  },

  // ScamAdviser API
  scamAdviser: {
    apiKey: process.env.SCAMADVISER_API_KEY,
    baseUrl: 'https://api.scamadviser.cloud',
    enabled: !!process.env.SCAMADVISER_API_KEY,
    endpoints: {
      domainAnalyzer: '/v1/domain-analyzer',
      trustScore: '/v1/trust-score'
    }
  },

  // CriminalIP API (disabled - now public source)
  criminalIP: {
    apiKey: process.env.CRIMINALIP_API_KEY,
    baseUrl: 'https://api.criminalip.io',
    enabled: !!process.env.CRIMINALIP_API_KEY && !process.env.CRIMINALIP_API_KEY.includes('disabled'),
    endpoints: {
      ipData: '/v1/ip/data',
      ipSummary: '/v1/ip/summary',
      domainReport: '/v1/domain/report'
    }
  },

  // IP Quality Score API
  ipQualityScore: {
    apiKey: process.env.IPQUALITYSCORE_API_KEY,
    baseUrl: 'https://ipqualityscore.com/api/json',
    enabled: !!process.env.IPQUALITYSCORE_API_KEY,
    endpoints: {
      ip: '/ip',
      url: '/url',
      email: '/email'
    }
  },

  // VirusTotal API (existing)
  virusTotal: {
    apiKey: process.env.VIRUSTOTAL_API_KEY,
    baseUrl: 'https://www.virustotal.com/vtapi/v2',
    enabled: !!process.env.VIRUSTOTAL_API_KEY,
    endpoints: {
      urlReport: '/url/report',
      urlScan: '/url/scan'
    }
  },

  // Hudson Rock API
  hudsonRock: {
    apiKey: process.env.HUDSONROCK_API_KEY,
    baseUrl: 'https://cavalier.hudsonrock.com',
    enabled: !!process.env.HUDSONROCK_API_KEY,
    endpoints: {
      searchByEmail: '/api/json/v2/osint-tools/search-by-email',
      searchByDomain: '/api/json/v2/osint-tools/search-by-domain'
    }
  },

  // Request timeouts and retries
  requestConfig: {
    timeout: 10000, // 10 seconds
    retries: 2,
    retryDelay: 1000 // 1 second
  },

  // Rate limiting
  rateLimits: {
    screenshotOne: { requests: 100, window: 3600000 }, // 100/hour
    googleSafeBrowsing: { requests: 10000, window: 86400000 }, // 10k/day
    phishTank: { requests: 500, window: 3600000 }, // 500/hour
    scamAdviser: { requests: 1000, window: 86400000 }, // 1k/day
    criminalIP: { requests: 2000, window: 86400000 }, // 2k/day
    ipQualityScore: { requests: 5000, window: 2592000000 }, // 5k/month
    virusTotal: { requests: 4, window: 60000 }, // 4/minute
    hudsonRock: { requests: 100, window: 3600000 } // 100/hour
  }
};

// Validate configuration
const validateConfig = () => {
  const enabledServices = [];
  const disabledServices = [];

  Object.keys(config).forEach(service => {
    if (service === 'requestConfig' || service === 'rateLimits') return;
    
    if (config[service].enabled) {
      enabledServices.push(service);
    } else {
      disabledServices.push(service);
    }
  });

  console.log('🔧 Third-party API Configuration:');
  console.log('✅ Enabled services:', enabledServices.join(', '));
  if (disabledServices.length > 0) {
    console.log('❌ Disabled services:', disabledServices.join(', '));
  }

  return { enabledServices, disabledServices };
};

module.exports = {
  config,
  validateConfig
};
