// Example: Auth Service with Circuit Breaker
const CircuitBreaker = require('../../shared/utils/circuitBreaker');

class AuthServiceClient {
  constructor() {
    // Circuit breaker cho mỗi external dependency
    this.firebaseCircuit = new CircuitBreaker({
      timeout: 3000,
      threshold: 3,
      resetTimeout: 30000
    });
    
    this.databaseCircuit = new CircuitBreaker({
      timeout: 5000,
      threshold: 5,
      resetTimeout: 60000
    });
  }

  async validateToken(token) {
    return this.firebaseCircuit.call(
      // Primary function
      async () => {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return { valid: true, uid: decodedToken.uid };
      },
      // Fallback function
      () => {
        console.log('🔄 Firebase down - using cached validation');
        return this.getCachedTokenValidation(token);
      }
    );
  }

  async getUserProfile(uid) {
    return this.databaseCircuit.call(
      // Primary function
      async () => {
        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.data();
      },
      // Fallback function
      () => {
        console.log('🔄 Database down - using cached profile');
        return this.getCachedUserProfile(uid);
      }
    );
  }

  // Fallback methods
  getCachedTokenValidation(token) {
    // Return cached validation or basic validation
    return {
      valid: this.isValidTokenFormat(token),
      uid: this.extractUidFromToken(token),
      cached: true
    };
  }

  getCachedUserProfile(uid) {
    // Return basic user info or cached data
    return {
      uid,
      email: 'cached@user.com',
      role: 'user',
      cached: true
    };
  }

  isValidTokenFormat(token) {
    // Basic token format validation
    return token && token.length > 50 && token.includes('.');
  }

  extractUidFromToken(token) {
    try {
      // Basic UID extraction (unsafe for production)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.uid;
    } catch {
      return 'unknown_user';
    }
  }
}

module.exports = AuthServiceClient;
