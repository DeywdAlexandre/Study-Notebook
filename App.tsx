
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ConfirmationProvider>
          <HomePage />
        </ConfirmationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
