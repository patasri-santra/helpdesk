import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/register');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err) {
  const data = err.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join('. ');
  return data?.message || 'Something went wrong. Please try again.';
}

export default api;
