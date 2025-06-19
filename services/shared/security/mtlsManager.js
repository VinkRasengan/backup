/**
 * Mutual TLS Manager
 * Manages mutual TLS certificates for service-to-service communication
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const https = require('https');

class MTLSManager {
  constructor(options = {}) {
    this.certDir = options.certDir || path.join(__dirname, '../../../certs');
    this.caKeyPath = path.join(this.certDir, 'ca-key.pem');
    this.caCertPath = path.join(this.certDir, 'ca-cert.pem');
    this.serviceCerts = new Map();
    this.certValidityDays = options.certValidityDays || 365;
    this.keySize = options.keySize || 2048;
    
    this.ensureCertDirectory();
  }

  /**
   * Ensure certificate directory exists
   */
  async ensureCertDirectory() {
    try {
      await fs.mkdir(this.certDir, { recursive: true });
      console.log(`Certificate directory ensured: ${this.certDir}`);
    } catch (error) {
      console.error('Failed to create certificate directory:', error);
    }
  }

  /**
   * Generate CA certificate if it doesn't exist
   */
  async generateCA() {
    try {
      // Check if CA already exists
      try {
        await fs.access(this.caCertPath);
        await fs.access(this.caKeyPath);
        console.log('CA certificate already exists');
        return;
      } catch {
        // CA doesn't exist, create it
      }

      console.log('Generating CA certificate...');

      // Generate CA private key
      const caKey = crypto.generateKeyPairSync('rsa', {
        modulusLength: this.keySize,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      // Create CA certificate
      const caCert = this.createCertificate({
        subject: {
          commonName: 'Anti-Fraud Platform CA',
          organizationName: 'Anti-Fraud Platform',
          countryName: 'US'
        },
        issuer: null, // Self-signed
        publicKey: caKey.publicKey,
        privateKey: caKey.privateKey,
        isCA: true,
        validityDays: this.certValidityDays * 5 // CA valid for 5x longer
      });

      // Save CA files
      await fs.writeFile(this.caKeyPath, caKey.privateKey);
      await fs.writeFile(this.caCertPath, caCert);

      // Set restrictive permissions
      await fs.chmod(this.caKeyPath, 0o600);
      await fs.chmod(this.caCertPath, 0o644);

      console.log('CA certificate generated successfully');
    } catch (error) {
      console.error('Failed to generate CA certificate:', error);
      throw error;
    }
  }

  /**
   * Generate service certificate
   */
  async generateServiceCertificate(serviceName) {
    try {
      await this.generateCA(); // Ensure CA exists

      console.log(`Generating certificate for service: ${serviceName}`);

      // Load CA certificate and key
      const caKey = await fs.readFile(this.caKeyPath, 'utf8');
      const caCert = await fs.readFile(this.caCertPath, 'utf8');

      // Generate service key pair
      const serviceKey = crypto.generateKeyPairSync('rsa', {
        modulusLength: this.keySize,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      // Create service certificate
      const serviceCert = this.createCertificate({
        subject: {
          commonName: serviceName,
          organizationName: 'Anti-Fraud Platform',
          organizationalUnitName: 'Microservices',
          countryName: 'US'
        },
        issuer: {
          commonName: 'Anti-Fraud Platform CA',
          organizationName: 'Anti-Fraud Platform',
          countryName: 'US'
        },
        publicKey: serviceKey.publicKey,
        privateKey: caKey,
        isCA: false,
        validityDays: this.certValidityDays,
        subjectAltNames: [
          `DNS:${serviceName}`,
          `DNS:${serviceName}.local`,
          `DNS:localhost`,
          'IP:127.0.0.1'
        ]
      });

      // Save service certificate files
      const serviceKeyPath = path.join(this.certDir, `${serviceName}-key.pem`);
      const serviceCertPath = path.join(this.certDir, `${serviceName}-cert.pem`);

      await fs.writeFile(serviceKeyPath, serviceKey.privateKey);
      await fs.writeFile(serviceCertPath, serviceCert);

      // Set permissions
      await fs.chmod(serviceKeyPath, 0o600);
      await fs.chmod(serviceCertPath, 0o644);

      // Store in memory
      this.serviceCerts.set(serviceName, {
        keyPath: serviceKeyPath,
        certPath: serviceCertPath,
        key: serviceKey.privateKey,
        cert: serviceCert,
        caCert: caCert,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + this.certValidityDays * 24 * 60 * 60 * 1000)
      });

      console.log(`Certificate generated for service: ${serviceName}`);
      return this.serviceCerts.get(serviceName);
    } catch (error) {
      console.error(`Failed to generate certificate for ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Create certificate (simplified version - in production use proper certificate library)
   */
  createCertificate(options) {
    // This is a simplified implementation
    // In production, use libraries like node-forge or openssl bindings
    
    const cert = [
      '-----BEGIN CERTIFICATE-----',
      // Certificate data would go here
      // For now, return a placeholder
      Buffer.from(JSON.stringify({
        subject: options.subject,
        issuer: options.issuer || options.subject,
        publicKey: options.publicKey,
        isCA: options.isCA,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + options.validityDays * 24 * 60 * 60 * 1000).toISOString(),
        subjectAltNames: options.subjectAltNames || []
      })).toString('base64'),
      '-----END CERTIFICATE-----'
    ].join('\n');

    return cert;
  }

  /**
   * Get service certificate
   */
  async getServiceCertificate(serviceName) {
    let cert = this.serviceCerts.get(serviceName);
    
    if (!cert) {
      // Try to load from disk
      const serviceKeyPath = path.join(this.certDir, `${serviceName}-key.pem`);
      const serviceCertPath = path.join(this.certDir, `${serviceName}-cert.pem`);
      
      try {
        const key = await fs.readFile(serviceKeyPath, 'utf8');
        const certData = await fs.readFile(serviceCertPath, 'utf8');
        const caCert = await fs.readFile(this.caCertPath, 'utf8');
        
        cert = {
          keyPath: serviceKeyPath,
          certPath: serviceCertPath,
          key,
          cert: certData,
          caCert,
          generatedAt: new Date(), // Would parse from cert in production
          expiresAt: new Date(Date.now() + this.certValidityDays * 24 * 60 * 60 * 1000)
        };
        
        this.serviceCerts.set(serviceName, cert);
      } catch (error) {
        // Certificate doesn't exist, generate it
        cert = await this.generateServiceCertificate(serviceName);
      }
    }
    
    return cert;
  }

  /**
   * Create HTTPS server options for service
   */
  async createServerOptions(serviceName) {
    const cert = await this.getServiceCertificate(serviceName);
    
    return {
      key: cert.key,
      cert: cert.cert,
      ca: cert.caCert,
      requestCert: true,
      rejectUnauthorized: true,
      secureProtocol: 'TLSv1_2_method'
    };
  }

  /**
   * Create HTTPS client options for service
   */
  async createClientOptions(serviceName) {
    const cert = await this.getServiceCertificate(serviceName);
    
    return {
      key: cert.key,
      cert: cert.cert,
      ca: cert.caCert,
      rejectUnauthorized: true,
      secureProtocol: 'TLSv1_2_method'
    };
  }

  /**
   * Verify peer certificate
   */
  verifyPeerCertificate(peerCert, allowedServices = []) {
    try {
      // Extract common name from certificate
      const commonName = this.extractCommonName(peerCert);
      
      if (allowedServices.length > 0 && !allowedServices.includes(commonName)) {
        return { valid: false, reason: 'Service not in allowed list' };
      }

      // Check if certificate is expired
      const now = new Date();
      if (peerCert.valid_to && new Date(peerCert.valid_to) < now) {
        return { valid: false, reason: 'Certificate expired' };
      }

      if (peerCert.valid_from && new Date(peerCert.valid_from) > now) {
        return { valid: false, reason: 'Certificate not yet valid' };
      }

      return { 
        valid: true, 
        serviceName: commonName,
        fingerprint: peerCert.fingerprint
      };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Extract common name from certificate
   */
  extractCommonName(cert) {
    if (cert.subject && cert.subject.CN) {
      return cert.subject.CN;
    }
    
    // Parse subject string
    const subject = cert.subject || '';
    const cnMatch = subject.match(/CN=([^,]+)/);
    return cnMatch ? cnMatch[1] : 'unknown';
  }

  /**
   * Check certificate expiration
   */
  async checkCertificateExpiration() {
    const expiringCerts = [];
    const warningDays = 30; // Warn 30 days before expiration
    
    for (const [serviceName, cert] of this.serviceCerts) {
      const daysUntilExpiry = Math.floor((cert.expiresAt - new Date()) / (24 * 60 * 60 * 1000));
      
      if (daysUntilExpiry <= warningDays) {
        expiringCerts.push({
          serviceName,
          expiresAt: cert.expiresAt,
          daysUntilExpiry
        });
      }
    }
    
    return expiringCerts;
  }

  /**
   * Renew service certificate
   */
  async renewServiceCertificate(serviceName) {
    console.log(`Renewing certificate for service: ${serviceName}`);
    
    // Remove old certificate
    this.serviceCerts.delete(serviceName);
    
    // Generate new certificate
    return await this.generateServiceCertificate(serviceName);
  }

  /**
   * Get mTLS status
   */
  getStatus() {
    const status = {
      caExists: false,
      serviceCertificates: {},
      totalCertificates: this.serviceCerts.size
    };

    // Check CA existence
    try {
      require('fs').accessSync(this.caCertPath);
      status.caExists = true;
    } catch {
      status.caExists = false;
    }

    // Service certificate status
    for (const [serviceName, cert] of this.serviceCerts) {
      status.serviceCertificates[serviceName] = {
        exists: true,
        generatedAt: cert.generatedAt,
        expiresAt: cert.expiresAt,
        daysUntilExpiry: Math.floor((cert.expiresAt - new Date()) / (24 * 60 * 60 * 1000))
      };
    }

    return status;
  }

  /**
   * Initialize all service certificates
   */
  async initializeAllServiceCertificates() {
    const services = [
      'api-gateway',
      'auth-service', 
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service'
    ];

    console.log('Initializing certificates for all services...');
    
    for (const serviceName of services) {
      try {
        await this.generateServiceCertificate(serviceName);
      } catch (error) {
        console.error(`Failed to initialize certificate for ${serviceName}:`, error);
      }
    }
    
    console.log('Service certificate initialization completed');
  }

  /**
   * Cleanup expired certificates
   */
  async cleanupExpiredCertificates() {
    const expiredCerts = [];
    
    for (const [serviceName, cert] of this.serviceCerts) {
      if (cert.expiresAt < new Date()) {
        expiredCerts.push(serviceName);
      }
    }
    
    for (const serviceName of expiredCerts) {
      console.log(`Removing expired certificate for: ${serviceName}`);
      this.serviceCerts.delete(serviceName);
      
      // Remove files
      try {
        await fs.unlink(path.join(this.certDir, `${serviceName}-key.pem`));
        await fs.unlink(path.join(this.certDir, `${serviceName}-cert.pem`));
      } catch (error) {
        console.error(`Failed to remove certificate files for ${serviceName}:`, error);
      }
    }
    
    return expiredCerts;
  }
}

module.exports = MTLSManager;
