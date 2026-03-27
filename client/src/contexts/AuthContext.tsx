import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authAPI, secureStorage, fetchCSRFToken } from '../services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: { username?: string; avatar?: string }) => Promise<void>;
  refreshToken: () => Promise<void>;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      // Run CSRF fetch and user fetch in parallel — they are independent
      const [csrfResult, userResult] = await Promise.allSettled([
        fetchCSRFToken(),
        authAPI.getCurrentUser(),
      ]);

      if (csrfResult.status === 'rejected') {
        console.warn('Could not initialize CSRF token on startup');
      }

      if (!isMounted) return;

      if (userResult.status === 'fulfilled') {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userResult.value.user } });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        const err = userResult.reason;
        if (err?.response?.status !== 401) {
          console.error('Auth initialization error:', err);
        }
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response: AuthResponse = await authAPI.login({ email, password });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user },
      });
      toast.success('Welcome back!');
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      
      // Enhanced error handling
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please try again later.');
      } else if (error.message?.includes('Network')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Login failed. Please try again.');
      }
      
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response: AuthResponse = await authAPI.register({ username, email, password });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user },
      });
      toast.success('Account created successfully!');
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      
      // Enhanced error handling
      if (error.response?.status === 409) {
        toast.error('User with this email or username already exists');
      } else if (error.response?.status === 400) {
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach((err: any) => {
            // Express-validator errors have a 'msg' property
            const errorMessage = typeof err === 'string' ? err : (err.msg || 'Validation error');
            toast.error(errorMessage);
          });
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Invalid input data');
        }
      } else if (error.message?.includes('Network')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      secureStorage.clearTokens();
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData: { username?: string; avatar?: string }) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({ type: 'UPDATE_PROFILE', payload: response.user });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Username is already taken');
      } else if (error.response?.status === 400) {
        toast.error('Invalid profile data');
      } else {
        toast.error('Failed to update profile');
      }
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      await authAPI.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
