import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  apiLogin,
  apiRegister,
  getCurrentUserId,
  setCurrentUserId,
  getUserById,
  updateUserProfile,
} from '../services/storage';
import { initializeData } from '../data/seedData';

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface RegisterData {
  login: string;
  password: string;
  fullName: string;
  specialty: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeData();
        const id = getCurrentUserId();
        if (id) {
          const currentUser = await getUserById(id);
          if (currentUser) setUserState(currentUser);
        }
      } catch (e) {
        console.error('Ошибка инициализации:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (loginStr: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await apiLogin(loginStr, password);
      if (foundUser) {
        setUserState(foundUser);
        setCurrentUserId(foundUser.id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const newUser = await apiRegister(userData);
      if (newUser) {
        setUserState(newUser);
        setCurrentUserId(newUser.id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUserState(null);
    setCurrentUserId(null);
  };

  const setUser = (updatedUser: User) => {
    setUserState(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      setUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};