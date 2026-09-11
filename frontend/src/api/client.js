import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

// Attach the JWT to every request if we have one.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login (session expired).
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we actually had a token (real expiry, not a fresh login failure)
      const hadToken = !!localStorage.getItem('dh_token');
      localStorage.removeItem('dh_token');
      localStorage.removeItem('dh_user');
      if (hadToken) {
        // Store the current path so we can redirect back after login
        sessionStorage.setItem('dh_redirect', window.location.pathname);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
