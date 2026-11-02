import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('expenzo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('expenzo_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('expenzo_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const me = await authService.getMe();
        setUser(me);
        localStorage.setItem('expenzo_user', JSON.stringify(me));
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem('expenzo_token');
        localStorage.removeItem('expenzo_user');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    if (data.token) {
      localStorage.setItem('expenzo_token', data.token);
      localStorage.setItem('expenzo_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await authService.register(name, email, password);
    if (data.token) {
      localStorage.setItem('expenzo_token', data.token);
      localStorage.setItem('expenzo_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
    }
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await authService.getMe();
      setUser(me);
      localStorage.setItem('expenzo_user', JSON.stringify(me));
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
