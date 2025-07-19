#!/usr/bin/env node

/**
 * Create Service-Specific Environment Files
 * Refactors monolithic .env to microservice-specific configurations
 */

const fs = require('fs');
const path = require('path');

// Service configurations
const serviceConfigs = {
  'community-service': {
    port: 3003,
    description: '👥 Community service specific environment variables\n# 🏘️ Handles community posts, discussions, and user interactions',
    requiredVars: [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL', 
      'FIREBASE_PRIVATE_KEY',
      'JWT_SECRET'
    ],
    optionalVars: []
  },
  'admin-service': {
    port: 3006,
    description: '👨‍💼 Admin service specific environment variables\n# 🛠️ Handles administrative functions and user management',
    requiredVars: [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY', 
      'JWT_SECRET'
    ],
    optionalVars: []
  },
  'phishtank-service': {
    port: 3007,
    description: '🎣 PhishTank service specific environment variables\n# 🛡️ Handles phishing detection using PhishTank API',
    requiredVars: [
      'JWT_SECRET'
    ],
    optionalVars: [
      'PHISHTANK_API_KEY'
    ]
  },
  'criminalip-service': {
    port: 3008,
    description: '🔍 CriminalIP service specific environment variables\n# 🚨 Handles IP reputation and threat intelligence',
    requiredVars: [
      'JWT_SECRET'
    ],
    optionalVars: [
      'CRIMINALIP_API_KEY'
    ]
  }
};

// Common environment variables
const commonVars = {
  FIREBASE_PROJECT_ID: 'factcheck-1d6e8',
  FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9ThjEoNlmvc1G\\n3KmKda7H9SgaT9BGSL8tMI6DPcBJGOOWPCGGWaIFCUFzrivVf1IMHp6evPZ5HxYW\\nejOA4VjJIJJDsaeMoMMED0NiPAC1nGJfOWzMHoBBPvZccDPBdeZDR/kvi3aIupHy\\nsF/9VLgjkfyBYGCxJzyCWOfNamuVp1pViE0MD6DY5aw1WTQvIfVtCgauZ0lFIGjQ\\nibsSkN4wWOup49mq4nEuHYK26coTmDUTaiamrAFYynLrnNprvA2JgAoZISw2e30m\\nYSsjEWENcXahS4bUrCYrOOyZHgvR1XeQ9eaCAo5elhvM9dfZfXaOgL5ZTVTR7GCp\\nMc/hYbvhAgMBAAECggEACOZReN/RmkhgWXO/y7wQt++99cJPubIrVk6vvU2x18eC\\nBMepN58vCqFFNx2wPvgFBzLvhNAM672EpN3HXi7mvrcXitoUCElsvNwSPRDL/SQp\\ncseCgCeLiSW44GuM+PKLEGaWkv/k1kFxLmS3PcCiuVdgZ91JIAlgb9KJ4uKDkgEI\\niGXbRBdX3+lnRIEqB1JPYk/ZUBXqgf/gt24gpZAVv0ET6jpTcyc/4zdPMd9xPOfZ\\nblqx4teHAIHoAzAFRGhuDus1I1L8QBe/Y3jjYynkacV0D89aOvIJfR5+HScnoQnw\\n/HK+4B090lYDNE+QPFXPdp8LLoHxrfg5GqDKYypULQKBgQD5uLfI/gulpMQSV73T\\nM+Jifk1ix9LZxYV+6htjpzoUBlvLshuwXfotfT3dott3/xjMMCJhfWaf/SVGjenc\\nXJiCGIGp+TlEKthiPnBxQcA41yq437g9X7dgwoeJP2PmEJrYKM9M7gKO9dVSOZig\\npRnR9WGnWAx7GNoU6ekTzUMRzQKBgQDCEIU3NvLH1n8V793/GaOP8IZSvKe0TpR1\\n5CaWjyB1D7wglABn5ItAbrsxZ2hEapQYgOSeAs/21vf9e9p61+OsVQQ0Hkihxm7O\\nesFuaSCAmbpRnpPHKWXrFK8CTr3EeanChmvk0GIY7XSDTkMVp1JhpZrbu8sWAsdz\\nsBIwnjyOZQKBgBYwGmxKXkCOfjlfAGfGoWO88yVGue5NhYn8RQi6sAdddUSJA7rM\\n7tCh4yBROwzTZqGl2TguSzMF7AzzyQaiV46fnM28biEnaWh5QcZeYDTssUgR4K3b\\nVlDLl/1S245yhT+ViK2+LA4Fu7l9kpkbckrccZvLz/gUAjR/gA0ZXM81AoGAAXyK\\n6K9dELbN5mcd9jRGEnYvMTcMuc7YSEblHMYf44WpVT6M+j6/6lBu0qQOImgGlmF2\\nXtd6rFNdNu3Z8JLyxYEpNRT+TW7trls2XBgmDZYf3TwvuZjRlQllhckAnx6ndDv/\\nW5NVDQfUmqTg0qujb+gK1aAMoDCJQpOYsBKmOBkCgYEA2FLpCjAdzggQ0lgqUKAg\\nMqlWkwzPXc2bX7LESv2j4z9acpigcnyeYiX/r0lcC3RDoQYXEmnPOsZwYHk/6dQq\\n6BuTSI2d0Ate1sRqV9sBNEtNThUf16ltgSmPZ4tfLVs8ZMN/unvjjOOEzkOWU0fW\\nEBQnrBKraXzzY0AzgveHhUg=\\n-----END PRIVATE KEY-----\\n"',
  JWT_SECRET: 'microservices_factcheck_platform_secret_key_development_2024_very_long_secure_key',
  PHISHTANK_API_KEY: 'disabled-no-registration-available',
  CRIMINALIP_API_KEY: 'disabled-now-public-source'
};

function createServiceEnvFile(serviceName, config) {
  const envPath = path.join(__dirname, '..', 'services', serviceName, '.env');
  
  let content = `# =============================================================================
# ${serviceName.toUpperCase().replace('-', ' ')} - ENVIRONMENT CONFIGURATION
# =============================================================================
# ${config.description}

# =============================================================================
# SERVICE IDENTIFICATION
# =============================================================================
SERVICE_NAME=${serviceName}
${serviceName.toUpperCase().replace('-', '_')}_PORT=${config.port}

`;

  // Add Firebase configuration if needed
  if (config.requiredVars.includes('FIREBASE_PROJECT_ID')) {
    content += `# =============================================================================
# FIREBASE CONFIGURATION (Required for data storage)
# =============================================================================
FIREBASE_PROJECT_ID=${commonVars.FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${commonVars.FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY=${commonVars.FIREBASE_PRIVATE_KEY}

`;
  }

  // Add JWT configuration
  if (config.requiredVars.includes('JWT_SECRET')) {
    content += `# =============================================================================
# JWT CONFIGURATION (Required for authentication)
# =============================================================================
JWT_SECRET=${commonVars.JWT_SECRET}

`;
  }

  // Add optional API keys
  if (config.optionalVars.length > 0) {
    content += `# =============================================================================
# SERVICE-SPECIFIC APIs (Optional)
# =============================================================================
`;
    config.optionalVars.forEach(varName => {
      if (commonVars[varName]) {
        content += `${varName}=${commonVars[varName]}\n`;
      }
    });
  }

  // Write the file
  fs.writeFileSync(envPath, content);
  console.log(`✅ Created ${serviceName}/.env`);
}

function main() {
  console.log('🔧 Creating service-specific .env files...\n');
  
  Object.entries(serviceConfigs).forEach(([serviceName, config]) => {
    createServiceEnvFile(serviceName, config);
  });
  
  console.log('\n✅ All service-specific .env files created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update env-loaders to prioritize local .env files');
  console.log('2. Test each service with new configuration');
  console.log('3. Remove duplicate configs from root .env');
}

if (require.main === module) {
  main();
}

module.exports = { createServiceEnvFile, serviceConfigs };
