import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Load stored auth on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('authUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = async (tokenVal, userVal) => {
    await AsyncStorage.setItem('authToken', tokenVal);
    await AsyncStorage.setItem('authUser', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const register = useCallback(async (name, email, password) => {
    setAuthError(null);
    try {
      const response = await authAPI.register({ name, email, password });
      await saveAuth(response.data.token, response.data.user);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const response = await authAPI.login({ email, password });
      await saveAuth(response.data.token, response.data.user);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Login failed. Please check your credentials.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['authToken', 'authUser']);
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, authError, register, login, logout, clearError, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
