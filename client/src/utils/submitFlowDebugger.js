// Debug utility for submit flow hanging issues
export class SubmitFlowDebugger {
  constructor() {
    this.logs = [];
    this.startTime = null;
  }

  log(message, data = null) {
    const timestamp = Date.now();
    const elapsed = this.startTime ? timestamp - this.startTime : 0;
    
    const logEntry = {
      timestamp,
      elapsed,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.log(`[${elapsed}ms] ${message}`, data || '');
  }

  start() {
    this.startTime = Date.now();
    this.logs = [];
    this.log('Submit flow started');
  }

  async testFirebaseToken() {
    this.log('Testing Firebase token refresh...');
    
    try {
      const { auth } = await import('../config/firebase');
      const user = auth.currentUser;
      
      if (!user) {
        this.log('❌ No Firebase user found');
        return false;
      }

      this.log('✅ Firebase user found', { uid: user.uid, email: user.email });
      
      // Test token refresh with timeout
      const tokenPromise = user.getIdToken(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token refresh timeout')), 5000)
      );
      
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      this.log('✅ Firebase token refreshed successfully', { 
        tokenLength: token.length,
        isValidJWT: token.split('.').length === 3
      });
      
      return true;
    } catch (error) {
      this.log('❌ Firebase token test failed', { error: error.message });
      return false;
    }
  }

  async testCommunityAPI() {
    this.log('Testing CommunityAPI connection...');
    
    try {
      const { communityAPI } = await import('../services/api');
      this.log('✅ CommunityAPI imported successfully');
      
      // Test with a simple GET request (should be faster)
      const testData = await communityAPI.getPosts({ limit: 1 });
      this.log('✅ CommunityAPI connection test successful', { 
        hasData: !!testData,
        dataType: typeof testData
      });
      
      return true;
    } catch (error) {
      this.log('❌ CommunityAPI test failed', { error: error.message });
      return false;
    }
  }

  async testSubmitFlow(testData) {
    this.log('Testing full submit flow...');
    
    try {
      const { communityAPI } = await import('../services/api');
      
      // Test the actual submit endpoint
      const response = await communityAPI.submitToCommunity(testData);
      this.log('✅ Submit flow test successful', { response });
      
      return true;
    } catch (error) {
      this.log('❌ Submit flow test failed', { error: error.message });
      return false;
    }
  }

  generateReport() {
    const totalTime = this.logs.length > 0 ? this.logs[this.logs.length - 1].elapsed : 0;
    
    return {
      totalTime,
      logs: this.logs,
      summary: {
        totalSteps: this.logs.length,
        errors: this.logs.filter(log => log.message.includes('❌')).length,
        successes: this.logs.filter(log => log.message.includes('✅')).length
      }
    };
  }
}

// Global debugger instance for easy access
window.submitDebugger = new SubmitFlowDebugger();

export default SubmitFlowDebugger;
