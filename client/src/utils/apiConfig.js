// Get API base URL with strict environment variable validation
const getApiBaseUrl = () => {
  // Check for required environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Production MUST have REACT_APP_API_URL set
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: REACT_APP_API_URL is required in production!');
    console.error('💡 Set REACT_APP_API_URL to your API Gateway URL');
    console.error('💡 Example: REACT_APP_API_URL=https://your-api-gateway.onrender.com');
    throw new Error('REACT_APP_API_URL environment variable is required in production');
  }

  // Development fallback with warning
  console.warn('⚠️  REACT_APP_API_URL not set, using localhost fallback');
  console.warn('💡 For better development experience, set REACT_APP_API_URL=http://localhost:8080');
  console.warn('💡 For Docker development, set REACT_APP_API_URL=http://api-gateway:8080');

  return 'http://localhost:8080'; // Development fallback only
};