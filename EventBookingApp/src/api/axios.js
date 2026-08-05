import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Change this to your local machine IP when running on a physical device ───
// For Android Emulator: http://10.0.2.2:5000/api
// For iOS Simulator: http://localhost:5000/api
// For Physical Device: http://<your-machine-IP>:5000/api
export const BASE_URL = 'http://10.0.2.2:5000/api';

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
