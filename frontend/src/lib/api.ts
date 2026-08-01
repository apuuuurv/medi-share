import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token dynamically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Check for both 'token' or 'accessToken' in localStorage
      let token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      if (token) {
        // Clean up quotes if stored with JSON.stringify by mistake
        token = token.replace(/^"(.*)"$/, '$1');
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses without throwing into endless login redirect loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn(`API Error [${error.response.status}]:`, error.response.data);
    }
    // Return error to caller so UI components can display error banners properly
    return Promise.reject(error);
  }
);

export default api;