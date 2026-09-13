import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
  },
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.url?.includes('/auth/login')) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken }, {
            headers: { 'X-API-Key': API_KEY }
          });
          if (res.data.access_token) {
            localStorage.setItem('access_token', res.data.access_token);
            if (res.data.refresh_token) {
              localStorage.setItem('refresh_token', res.data.refresh_token);
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const isCorrupt = (l: any) => {
  if (l.carpet_area > l.super_built_up_area) return true;
  if (l.price <= 0 || l.carpet_area <= 0) return true;
  if (l.floor > l.total_floors) return true;
  if (l.bathroom > l.bedroom + 4) return true;
  if (l.latitude < 18 || l.latitude > 20 || l.longitude < 72 || l.longitude > 74) return true;
  return false;
};

export const isFake = (l: any) => {
  if (!l.description) return false;
  return /visit only|below market|booking amount/i.test(l.description);
};

export const cleanListing = (l: any) => {
  const cleaned = { ...l };
  if (cleaned.website === 'magichomes' && cleaned.price > 0 && cleaned.carpet_area > 0) {
    if (cleaned.price / cleaned.carpet_area > 100000) {
      cleaned.carpet_area = Math.round(cleaned.carpet_area * 10.7639);
      if (cleaned.super_built_up_area) {
        cleaned.super_built_up_area = Math.round(cleaned.super_built_up_area * 10.7639);
      }
    }
  }
  return cleaned;
};

export const isValidListing = (l: any) => {
  return l.is_live && !isCorrupt(l) && !isFake(l);
};

export const cleanProject = (p: any) => {
  const cleaned = { ...p };
  if (cleaned.price_min < 1000) {
    cleaned.price_min = Math.round(cleaned.price_min * 10000000);
  }
  if (cleaned.price_max < 1000) {
    cleaned.price_max = Math.round(cleaned.price_max * 10000000);
  }
  return cleaned;
};
