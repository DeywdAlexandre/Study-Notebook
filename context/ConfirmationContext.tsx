
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

type ConfirmationContextType = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolve, setResolve] = useState<((result: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setOptions(options);
      setResolve(() => resolve);
    });
  }, []);

  const handleClose = () => {
    if (resolve) {
      resolve(false);
    }
    setOptions(null);
    setResolve(null);
  };

  const handleConfirm = () => {
    if (resolve) {
      resolve(true);
    }
    setOptions(null);
    setResolve(null);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationDialog
        isOpen={options !== null}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options?.title || ''}
        message={options?.message || ''}
        confirmButtonText={options?.confirmButtonText}
        cancelButtonText={options?.cancelButtonText}
      />
    </ConfirmationContext.Provider>
  );
};
