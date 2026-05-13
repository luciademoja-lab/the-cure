import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials, RegisterData } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'the-cure-auth';
const USERS_STORAGE_KEY = 'the-cure-users';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert date strings back to Date objects
        parsedUser.createdAt = new Date(parsedUser.createdAt);
        parsedUser.lastLoginAt = new Date(parsedUser.lastLoginAt);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getStoredUsers = (): Record<string, { user: User; password: string }> => {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  };

  const saveUser = (userData: User, password: string) => {
    const users = getStoredUsers();
    users[userData.email] = { user: userData, password };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const users = getStoredUsers();
      const userRecord = users[credentials.email];

      if (!userRecord || userRecord.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      const updatedUser = {
        ...userRecord.user,
        lastLoginAt: new Date()
      };

      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      saveUser(updatedUser, credentials.password);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const users = getStoredUsers();

      if (users[data.email]) {
        throw new Error('Email already registered');
      }

      if (data.age < 13) {
        throw new Error('You must be at least 13 years old to register');
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        email: data.email,
        nickname: data.nickname,
        age: data.age,
        gender: data.gender,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      saveUser(newUser, data.password);
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const users = getStoredUsers();

      if (!users[email]) {
        throw new Error('Email not found');
      }

      // In a real app, this would send an email
      // For demo purposes, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}