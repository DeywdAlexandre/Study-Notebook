import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Icon from './Icon';
import Spinner from './Spinner';

const AuthPortal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError, signInAsGuest } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // O onAuthStateChanged tratará do redirecionamento
    } catch (err: any) {
      // O erro já é capturado e exibido pelo `authError` do hook
    } finally {
        setLoading(false);
    }
  };
  
  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          if (isLogin) {
              await signInWithEmail(email, password);
          } else {
              await signUpWithEmail(email, password);
          }
           // O onAuthStateChanged tratará do redirecionamento
      } catch (err: any) {
          // O erro já é tratado e exibido pelo `authError` do hook
      } finally {
          setLoading(false);
      }
  }
  
  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      // O onAuthStateChanged tratará do redirecionamento
    } catch (err: any) {
      // O erro já é capturado e exibido pelo `authError` do hook
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      
      {authError && (
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md mb-4" role="alert">
            <div className="flex">
                <div className="py-1">
                    <Icon name="AlertTriangle" size={20} className="text-red-500 mr-3 flex-shrink-0" />
                </div>
                <div>
                    <p className="font-bold">Atenção</p>
                    <p className="text-sm leading-relaxed">{authError}</p>
                </div>
            </div>
        </div>
      )}

      <form onSubmit={handleEmailAuth}>
        <div className="mb-4">
          <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 flex items-center justify-center min-h-[42px]"
        >
          {loading ? <Spinner className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
        <span className="mx-4 text-slate-500 dark:text-slate-400">OR</span>
        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-300 text-slate-700 dark:text-slate-300"
      >
        <Icon name="Globe" size={20} />
        Sign in with Google
      </button>

      <div className="text-center mt-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">A ter problemas no AI Studio?</p>
        <button
          onClick={handleGuestSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-amber-500 text-amber-600 dark:text-amber-400 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition duration-300"
          title="Use esta opção se o login normal falhar no ambiente de desenvolvimento do AI Studio."
        >
          <Icon name="UserCog" size={20} />
          Continuar como Convidado (Desenvolvimento)
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button onClick={() => { setIsLogin(!isLogin); }} className="ml-1 text-blue-600 hover:underline">
          {isLogin ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </div>
  );
};

export default AuthPortal;