// System Test Utilities for FactCheck Application
// Tests chat interface, homepage layout, and overall system functionality

// Get API base URL (same logic as api.js)
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }

  return 'http://localhost:8080/api';
};

class SystemTest {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  // Test chat interface functionality
  async testChatInterface() {
    console.log('🧪 Testing Chat Interface...');
    
    try {
      // Test 1: Check if chat components are loaded
      const chatButton = document.querySelector('[title="Chat với AI"]');
      this.addResult('Chat button exists', !!chatButton);

      // Test 2: Test Gemini API endpoint
      const testMessage = 'Hello, this is a test message';
      const response = await fetch(`${getApiBaseUrl()}/chat/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({ message: testMessage })
      });

      this.addResult('Gemini API endpoint accessible', response.status < 500);
      
      if (response.ok) {
        const data = await response.json();
        this.addResult('Gemini API returns valid response', !!data);
      }

    } catch (error) {
      this.addError('Chat Interface Test', error.message);
    }
  }

  // Test homepage layout and responsiveness
  async testHomepageLayout() {
    console.log('🧪 Testing Homepage Layout...');
    
    try {
      // Test 1: Check for horizontal scroll
      const body = document.body;
      const html = document.documentElement;
      const hasHorizontalScroll = Math.max(
        body.scrollWidth, body.offsetWidth,
        html.clientWidth, html.scrollWidth, html.offsetWidth
      ) > window.innerWidth;
      
      this.addResult('No horizontal scroll', !hasHorizontalScroll);

      // Test 2: Check if main sections exist
      const heroSection = document.querySelector('section');
      this.addResult('Hero section exists', !!heroSection);

      // Test 3: Check responsive grid
      const gridElements = document.querySelectorAll('.grid');
      this.addResult('Grid layouts present', gridElements.length > 0);

      // Test 4: Check for duplicate hamburger menus
      const hamburgerMenus = document.querySelectorAll('[aria-label*="menu"], [aria-label*="Menu"]');
      this.addResult('No duplicate hamburger menus', hamburgerMenus.length <= 2);

      // Test 5: Check floating widgets
      const floatingWidgets = document.querySelector('.fixed.bottom-6.right-6');
      this.addResult('Floating widgets positioned correctly', !!floatingWidgets);

    } catch (error) {
      this.addError('Homepage Layout Test', error.message);
    }
  }

  // Test responsive design at different breakpoints
  async testResponsiveDesign() {
    console.log('🧪 Testing Responsive Design...');
    
    const breakpoints = [
      { name: 'Mobile', width: 375 },
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1024 },
      { name: 'Large Desktop', width: 1440 }
    ];

    for (const breakpoint of breakpoints) {
      try {
        // Simulate viewport resize
        window.innerWidth = breakpoint.width;
        window.dispatchEvent(new Event('resize'));
        
        // Wait for layout to adjust
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if layout adapts properly
        const hasOverflow = document.body.scrollWidth > breakpoint.width;
        this.addResult(`${breakpoint.name} (${breakpoint.width}px) - No overflow`, !hasOverflow);
        
      } catch (error) {
        this.addError(`Responsive Test - ${breakpoint.name}`, error.message);
      }
    }
  }

  // Test performance metrics
  async testPerformance() {
    console.log('🧪 Testing Performance...');
    
    try {
      // Test 1: Check for performance API
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        
        this.addResult('Page load time < 3s', loadTime < 3000);
        this.addResult('DOM content loaded < 2s', navigation.domContentLoadedEventEnd < 2000);
      }

      // Test 2: Check for memory leaks (basic)
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Simulate some operations
      for (let i = 0; i < 1000; i++) {
        const div = document.createElement('div');
        document.body.appendChild(div);
        document.body.removeChild(div);
      }
      
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      this.addResult('Memory usage stable', memoryIncrease < 1000000); // Less than 1MB increase

    } catch (error) {
      this.addError('Performance Test', error.message);
    }
  }

  // Test accessibility features
  async testAccessibility() {
    console.log('🧪 Testing Accessibility...');
    
    try {
      // Test 1: Check for ARIA labels
      const ariaElements = document.querySelectorAll('[aria-label]');
      this.addResult('ARIA labels present', ariaElements.length > 0);

      // Test 2: Check for alt text on images
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.alt);
      this.addResult('Images have alt text', imagesWithAlt.length === images.length);

      // Test 3: Check for keyboard navigation
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      this.addResult('Focusable elements present', focusableElements.length > 0);

      // Test 4: Check color contrast (basic)
      const body = getComputedStyle(document.body);
      const hasGoodContrast = body.color !== body.backgroundColor;
      this.addResult('Basic color contrast', hasGoodContrast);

    } catch (error) {
      this.addError('Accessibility Test', error.message);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting System Tests...');
    this.results = [];
    this.errors = [];

    await this.testHomepageLayout();
    await this.testChatInterface();
    await this.testResponsiveDesign();
    await this.testPerformance();
    await this.testAccessibility();

    this.generateReport();
  }

  // Helper methods
  addResult(testName, passed) {
    this.results.push({
      test: testName,
      passed,
      timestamp: new Date().toISOString()
    });
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  }

  addError(testName, error) {
    this.errors.push({
      test: testName,
      error,
      timestamp: new Date().toISOString()
    });
    
    console.error(`❌ ${testName}: ERROR - ${error}`);
  }

  // Generate test report
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n📊 TEST REPORT');
    console.log('================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.errors.forEach(error => {
        console.log(`- ${error.test}: ${error.error}`);
      });
    }

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.test}`);
      });
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      errors: this.errors,
      results: this.results
    };
  }
}

// Export for use in browser console or testing
window.SystemTest = SystemTest;

export default SystemTest;
