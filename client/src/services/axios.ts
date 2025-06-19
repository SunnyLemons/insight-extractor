import axios from 'axios';

// Create an axios instance with a base URL
const baseURL = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/api` 
  : 'https://insight-extractor-api.onrender.com/api';

console.log('API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Optional: Add request interceptor for logging or adding auth tokens
api.interceptors.request.use(
  (config) => {
    console.log('Request URL:', config.url);
    console.log('Base URL:', config.baseURL);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api; 