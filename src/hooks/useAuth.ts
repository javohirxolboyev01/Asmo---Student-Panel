import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, login, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    // Restore session on mount
    checkAuth();
  }, [checkAuth]);

  const loginUser = async (email: string, password: string) => {
    try {
      await login(email, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const registerUser = async (_name: string, _email: string, _password: string, _username?: string) => {
    // Registration logic would need to be implemented in authStore
    // For now, return a placeholder response
    return { success: false, error: 'Registration not implemented' };
  };

  const logoutUser = async () => {
    try {
      logout();
      navigate('/login');
      return { success: true };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const refreshUser = async () => {
    try {
      await checkAuth();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const clearAuthError = () => {
    // Error clearing would need to be implemented in authStore
  };

  const token = localStorage.getItem('token');

  return {
    user,
    token,
    isAuthenticated,
    loading: isLoading,
    error,
    loginUser,
    registerUser,
    logoutUser,
    refreshUser,
    clearAuthError,
  };
};
