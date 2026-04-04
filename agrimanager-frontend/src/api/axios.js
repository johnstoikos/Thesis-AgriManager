import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

api.interceptors.request.use(
  (config) => {
    // Αν το URL περιέχει "login", μη στέλνεις Authorization header
    if (config.url.includes('/api/auth/login')) {
      return config;
    }

    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default api; // ΑΥΤΗ Η ΓΡΑΜΜΗ ΕΙΝΑΙ Η ΚΡΙΣΙΜΗ