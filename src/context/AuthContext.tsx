// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api.ts';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Clean up legacy token from localStorage if present
      localStorage.removeItem('pulse_jwt_token');

      // Load optimistic user metadata if present
      const storedUser = localStorage.getItem('pulse_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('pulse_user');
        }
      }

      // Verify cookie session validity against backend settings api
      try {
        const profile = await api.getProfileSettings();
        const verifiedUser: User = {
          id: '',
          email: profile.email,
          display_name: profile.display_name,
        };
        // Preserve user ID if available in local state
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.id) {
              verifiedUser.id = parsed.id;
            }
          } catch {}
        }
        setUser(verifiedUser);
        localStorage.setItem('pulse_user', JSON.stringify(verifiedUser));
      } catch {
        // Clear state if session cookie validation fails
        setUser(null);
        localStorage.removeItem('pulse_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.loginJson({ email, password });
    localStorage.setItem('pulse_user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    await api.signup({ email, password, display_name: displayName });
  };

  const verifyEmail = async (email: string, code: string) => {
    const response = await api.verifyEmail({ email, code });
    localStorage.setItem('pulse_user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Failed to logout from backend:', err);
    } finally {
      localStorage.removeItem('pulse_user');
      localStorage.removeItem('pulse_jwt_token');
      setUser(null);
    }
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
        verifyEmail,
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
