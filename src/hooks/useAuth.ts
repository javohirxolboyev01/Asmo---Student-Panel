import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../features/store';
import { login, register, logout, getCurrentUser, restoreSession, clearError } from '../features/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Restore session on mount
    dispatch(restoreSession());
  }, [dispatch]);

  const loginUser = async (email: string, password: string) => {
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const registerUser = async (name: string, email: string, password: string, username?: string) => {
    try {
      const result = await dispatch(register({ name, email, password, username })).unwrap();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const logoutUser = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
      return { success: true };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const refreshUser = async () => {
    try {
      const user = await dispatch(getCurrentUser()).unwrap();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error as string };
    }
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    loginUser,
    registerUser,
    logoutUser,
    refreshUser,
    clearAuthError,
  };
};
