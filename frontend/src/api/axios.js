import axios from 'axios';

// Use environment variable for API URL in production, fallback to /api for local
const API_URL = process.env.REACT_APP_API_URL || '/api';

const API = axios.create({ 
  baseURL: API_URL,
  withCredentials: true // Important for CORS with credentials
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method.toUpperCase(), config.url); // Debug log
  return config;
});

API.interceptors.response.use(
  (res) => {
    console.log('API Response:', res.status, res.config.url); // Debug log
    return res;
  },
  (err) => {
    console.error('API Error:', err.response?.status, err.config?.url, err.response?.data);
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;