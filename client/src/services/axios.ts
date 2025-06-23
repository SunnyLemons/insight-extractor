import axios from 'axios';

// Debugging: Log all environment variables
console.log('Full Environment:', process.env);

// Create an axios instance with a base URL
const getBaseURL = () => {
  // Determine the base URL based on the environment
  const env = process.env.NODE_ENV || 'development';
  
  // Default URLs for different environments
  const envBaseUrls = {
    development: 'http://localhost:3011',
    production: 'https://insight-extractor.netlify.app/api',
    test: 'http://localhost:3011'
  };

  // Prioritize environment variable, then environment-specific default
  let baseURL = process.env.REACT_APP_API_BASE_URL || envBaseUrls[env];
  
  // Remove trailing slash, '/api', and any extra slashes
  baseURL = baseURL.replace(/\/+$/, '').replace(/\/api$/, '');
  
  console.log('🌐 Processed Base URL:', baseURL);
  console.log('🌍 Current Environment:', env);
  
  // Ensure only one '/api' is present
  return `${baseURL}/api`;
};

const baseURL = getBaseURL();

console.log('🌐 Final API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for comprehensive logging
api.interceptors.request.use(
  (config) => {
    console.group('📡 API Request');
    console.log('URL:', config.url);
    console.log('Base URL:', config.baseURL);
    console.log('Full URL:', `${config.baseURL}${config.url}`);
    console.log('Method:', config.method);
    console.groupEnd();
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.group('✅ API Response');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  (error) => {
    console.group('❌ API Error');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Response:', error.response ? {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    } : 'No response');
    console.error('Request Config:', error.config);
    console.groupEnd();
    
    // Provide more context for network errors
    if (error.message === 'Network Error') {
      console.error('🌐 Possible CORS or Network Issues:', {
        baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown',
        environment: process.env.NODE_ENV,
        requestHeaders: error.config?.headers
      });
    }
    
    return Promise.reject(error);
  }
);

export default api; 