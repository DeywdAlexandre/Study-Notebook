
import React, { createContext, useContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  // FIX: Add missing sign-in methods for compatibility with AuthPortal component.
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
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
      // FIX: Implement dummy sign-in methods for offline demo mode.
      signInWithGoogle: () => {
        alert("O login com Google não está disponível no modo offline.");
        return Promise.resolve();
      },
      signInWithEmail: (_email: string, _pass: string) => {
        alert("O login com email não está disponível no modo offline.");
        return Promise.resolve();
      },
      signUpWithEmail: (_email: string, _pass: string) => {
        alert("O registo com email não está disponível no modo offline.");
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
