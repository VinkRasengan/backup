// Get API base URL with environment variable support
const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    // Use environment variable for production API Gateway URL
    return process.env.REACT_APP_API_GATEWAY_URL || '/api';
  }

  return 'http://localhost:8080'; // Development fallback (API Gateway port)
};