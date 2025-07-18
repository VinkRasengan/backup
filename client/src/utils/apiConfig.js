// Get API base URL with environment variable support
const getApiBaseUrl = () => {
  // Use environment variable if set (production should have this)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    // For production, use relative URLs that will be handled by _redirects
    return '';
  }

  return 'http://localhost:8080'; // Development fallback (API Gateway port)
};