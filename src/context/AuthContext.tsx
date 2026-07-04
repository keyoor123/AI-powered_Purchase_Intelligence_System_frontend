// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api.ts';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateUserDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user token and credentials exist in localStorage
    const token = localStorage.getItem('pulse_jwt_token');
    const storedUser = localStorage.getItem('pulse_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Clear if corrupt
        localStorage.removeItem('pulse_jwt_token');
        localStorage.removeItem('pulse_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.loginJson({ email, password });
    localStorage.setItem('pulse_jwt_token', response.access_token);
    localStorage.setItem('pulse_user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const response = await api.signup({ email, password, display_name: displayName });
    localStorage.setItem('pulse_jwt_token', response.access_token);
    localStorage.setItem('pulse_user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('pulse_jwt_token');
    localStorage.removeItem('pulse_user');
    setUser(null);
  };

  const updateUserDisplayName = (name: string) => {
    if (user) {
      const updated = { ...user, display_name: name };
      localStorage.setItem('pulse_user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        signup,
        logout,
        updateUserDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
