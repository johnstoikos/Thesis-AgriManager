import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

const getStoredToken = () => localStorage.getItem('jwt') || sessionStorage.getItem('jwt');

api.interceptors.request.use(
  (config) => {
    // Αν το URL περιέχει "login", μη στέλνεις Authorization header
    if (config.url?.includes('/api/auth/login')) {
      return config;
    }

    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = typeof error.response?.data === 'string'
        ? error.response.data
        : error.response?.data?.message;
      if (message) {
        sessionStorage.setItem('authErrorMessage', message);
      }

      localStorage.clear();
      const authErrorMessage = sessionStorage.getItem('authErrorMessage');
      sessionStorage.clear();
      if (authErrorMessage) {
        sessionStorage.setItem('authErrorMessage', authErrorMessage);
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api; // ΑΥΤΗ Η ΓΡΑΜΜΗ ΕΙΝΑΙ Η ΚΡΙΣΙΜΗ
