import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInAnonymously,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, firebaseError, firebaseConfig } from '../services/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(firebaseError);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Primeiro, verifica o resultado de um redirecionamento de login.
    // Isto é crucial para o fluxo de signInWithRedirect.
    getRedirectResult(auth)
      .catch((error) => {
        // Captura e trata erros que ocorreram durante o redirecionamento.
        const friendlyError = handleError(error);
        setAuthError(friendlyError);
      });

    // onAuthStateChanged irá então lidar com a definição do estado do utilizador,
    // quer venha de um login por redirecionamento ou de uma sessão existente.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleError = (error: any) => {
    console.error("Auth Error:", error);
    // Mapeia códigos de erro comuns do Firebase para mensagens amigáveis
    switch (error.code) {
      case 'auth/invalid-email':
        return 'O formato do e-mail é inválido.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou palavra-passe incorretos.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está a ser utilizado por outra conta.';
      case 'auth/weak-password':
        return 'A palavra-passe deve ter pelo menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'A janela de login foi fechada. Por favor, tente novamente.';
      case 'auth/unauthorized-domain': {
        const hostname = window.location.hostname;
        if (hostname) {
            return `O domínio '${hostname}' não está autorizado. Adicione este domínio à sua lista de "Authorized domains" nas configurações de Autenticação (Authentication > Settings) do seu projeto Firebase.`;
        } else {
            const exampleDomain = firebaseConfig.projectId
                ? `${firebaseConfig.projectId}.aistudio.google.com`
                : 'SEU_ID_DE_PROJETO.aistudio.google.com';
            return `Este domínio não está autorizado. A aplicação parece estar a ser executada num ambiente restrito (ex: iframe) onde o domínio não é detetado. Com base no seu ficheiro de configuração, o domínio que precisa de adicionar à sua lista de "Authorized domains" no Firebase é provavelmente: ${exampleDomain}`;
        }
      }
      default:
        return `Ocorreu um erro inesperado (${error.code || 'desconhecido'}).`;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("A autenticação não está inicializada.");
    try {
      setAuthError(null);
      // Alterado de signInWithPopup para signInWithRedirect para melhor compatibilidade com iframes.
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      const friendlyError = handleError(error);
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("A autenticação não está inicializada.");
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      const friendlyError = handleError(error);
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("A autenticação não está inicializada.");
    try {
      setAuthError(null);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      const friendlyError = handleError(error);
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };
  
  const signInAsGuest = async () => {
    if (!auth) throw new Error("A autenticação não está inicializada.");
    try {
      setAuthError(null);
      await signInAnonymously(auth);
    } catch (error) {
      const friendlyError = handleError(error);
      setAuthError(friendlyError);
      throw new Error(friendlyError);
    }
  };

  const signOutUser = async () => {
    if (!auth) throw new Error("A autenticação não está inicializada.");
    try {
      await signOut(auth);
    } catch (error) {
      setAuthError(handleError(error));
    }
  };
  
  const value: AuthContextType = {
      user,
      loading,
      signOutUser,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInAsGuest,
      authError
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