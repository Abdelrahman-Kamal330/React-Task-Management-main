import { createContext, useContext, useState, ReactNode } from 'react';
import {
  getMe,
  loginUser,
  registerUser,
  logout as logoutUser,
  User,
} from '../api/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getMe());

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await registerUser({ name, email, password });
    setUser(response.user);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
