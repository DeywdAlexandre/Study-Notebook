
import React, { createContext, useContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fornece um utilizador de demonstração estático para o modo offline
  const demoUser: User = {
    uid: 'demo-user-id',
    email: 'demo@example.com',
    displayName: 'Demo User',
  };

  const value: AuthContextType = {
      user: demoUser,
      loading: false, // O carregamento é sempre instantâneo no modo offline
      signOutUser: () => { 
        alert("O logout não está disponível no modo offline."); 
        return Promise.resolve(); 
      },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};