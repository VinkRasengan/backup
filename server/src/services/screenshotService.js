const axios = require('axios');

class ScreenshotService {
  constructor() {
    this.apiKey = process.env.SCREENSHOTLAYER_API_KEY;
    this.apiUrl = 'http://api.screenshotlayer.com/api/capture';
    this.lastRequestTime = 0;
    this.requestDelay = 1000; // 1 second between requests
  }

  /**
   * Enforce rate limiting
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Take screenshot of a URL using ScreenshotLayer API
   */
  async takeScreenshot(url, options = {}) {
    try {
      if (!this.apiKey) {
        console.warn('ScreenshotLayer API key not configured');
        return {
          success: false,
          error: 'ScreenshotLayer API key not configured',
          screenshotUrl: this.getFallbackScreenshot(url)
        };
      }

      await this.enforceRateLimit();

      console.log(`Taking screenshot with ScreenshotLayer: ${url}`);

      // Default options
      const defaultOptions = {
        width: 1280,
        viewport: '1280x1024',
        format: 'PNG',
        fullpage: 0,
        force: 0,
        delay: 3,
        ttl: 2592000, // 30 days cache
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Build API URL with parameters
      const params = new URLSearchParams({
        access_key: this.apiKey,
        url: url,
        width: finalOptions.width,
        viewport: finalOptions.viewport,
        format: finalOptions.format,
        fullpage: finalOptions.fullpage,
        force: finalOptions.force,
        delay: finalOptions.delay,
        ttl: finalOptions.ttl,
        user_agent: finalOptions.user_agent
      });

      const screenshotUrl = `${this.apiUrl}?${params.toString()}`;

      // Test if the screenshot URL is accessible
      const response = await axios.head(screenshotUrl, {
        timeout: 30000 // 30 second timeout
      });

      if (response.status === 200) {
        console.log('✅ Screenshot taken successfully');
        return {
          success: true,
          screenshotUrl: screenshotUrl,
          options: finalOptions,
          takenAt: new Date().toISOString()
        };
      } else {
        throw new Error(`Screenshot API returned status: ${response.status}`);
      }

    } catch (error) {
      console.error('ScreenshotLayer error:', error.message);
      
      // Return fallback screenshot
      return {
        success: false,
        error: error.message,
        screenshotUrl: this.getFallbackScreenshot(url),
        fallback: true
      };
    }
  }

  /**
   * Get fallback screenshot URL
   */
  getFallbackScreenshot(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://via.placeholder.com/1280x720/f0f0f0/666666?text=${encodeURIComponent(domain)}`;
    } catch (error) {
      return 'https://via.placeholder.com/1280x720/f0f0f0/666666?text=Invalid+URL';
    }
  }

  /**
   * Take screenshot with mobile viewport
   */
  async takeMobileScreenshot(url) {
    return await this.takeScreenshot(url, {
      width: 375,
      viewport: '375x667',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    });
  }

  /**
   * Take full page screenshot
   */
  async takeFullPageScreenshot(url) {
    return await this.takeScreenshot(url, {
      fullpage: 1,
      width: 1280,
      viewport: '1280x1024'
    });
  }

  /**
   * Validate screenshot URL
   */
  async validateScreenshot(screenshotUrl) {
    try {
      const response = await axios.head(screenshotUrl, {
        timeout: 10000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get screenshot with retry logic
   */
  async takeScreenshotWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Screenshot attempt ${attempt}/${maxRetries} for: ${url}`);
      
      const result = await this.takeScreenshot(url);
      
      if (result.success) {
        return result;
      }
      
      if (attempt < maxRetries) {
        console.log(`Retrying screenshot in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    
    // All attempts failed, return fallback
    return {
      success: false,
      error: 'All screenshot attempts failed',
      screenshotUrl: this.getFallbackScreenshot(url),
      fallback: true
    };
  }
}

module.exports = new ScreenshotService();
