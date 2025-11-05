import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important to send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to log requests and errors
api.interceptors.request.use(
  (config) => {
    console.log('API request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Connection error: Backend is not running or not accessible at http://localhost:3000');
    } else if (error.response) {
      const status = error.response.status;
      const url = error.config.url;
      if (status === 401) {
        console.log('Unauthorized:', url);
      } else {
        console.error('API error:', status, url, error.response.data);
      }
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

