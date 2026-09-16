import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Production Hosted Backend (Vercel) ───────────────────────────────────────
export const BASE_URL = 'https://event-booking-system-gules.vercel.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT Token ────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle errors globally ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.multiRemove(['authToken', 'authUser']);
    }
    return Promise.reject(error);
  }
);

export default api;
