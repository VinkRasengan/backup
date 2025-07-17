// Circuit Breaker Implementation for Anti-Fraud Platform
// This is an example implementation - you would install a library like 'opossum'

class CircuitBreaker {
  constructor(options = {}) {
    this.timeout = options.timeout || 3000; // 3s timeout
    this.threshold = options.threshold || 5; // 5 failures to open
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute to retry
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async call(fn, fallback) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.log('🔴 Circuit OPEN - Using fallback');
        return fallback ? fallback() : Promise.reject(new Error('Circuit breaker is OPEN'));
      } else {
        this.state = 'HALF_OPEN';
        console.log('🟡 Circuit HALF_OPEN - Testing service');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]);
      
      // Success - reset circuit
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure - update circuit
      this.onFailure();
      
      if (fallback) {
        console.log('⚠️ Using fallback due to error:', error.message);
        return fallback();
      }
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('✅ Circuit CLOSED - Service healthy');
  }

  onFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`🔴 Circuit OPEN - ${this.failureCount} failures detected`);
    }
  }
}

module.exports = CircuitBreaker;
