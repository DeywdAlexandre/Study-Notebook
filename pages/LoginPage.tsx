
import React from 'react';
import AuthPortal from '../components/AuthPortal';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <AuthPortal />
    </div>
  );
};

export default LoginPage;