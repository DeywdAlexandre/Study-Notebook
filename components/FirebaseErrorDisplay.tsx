import React from 'react';
import Icon from './Icon';

interface FirebaseErrorDisplayProps {
  error: string;
}

const FirebaseErrorDisplay: React.FC<FirebaseErrorDisplayProps> = ({ error }) => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-red-500/30">
        <div className="flex items-center gap-4 mb-4">
          <Icon name="Flame" size={32} className="text-red-500" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Erro de Configuração do Firebase</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-6 font-normal">
          A aplicação não conseguiu ligar-se ao Firebase. Isto acontece normalmente porque as credenciais do projeto não foram configuradas.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Mensagem de Erro:</p>
          <code className="block text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded font-mono">{error}</code>
        </div>
        <div className="mt-6">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Como resolver:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 font-normal">
            <li>Vá à <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">consola do Firebase</a> e selecione o seu projeto.</li>
            <li>Nas definições do projeto (<Icon name="Settings" className="inline-block" size={14}/>), encontre as credenciais da sua aplicação web.</li>
            <li>Copie o objeto de configuração <code>firebaseConfig</code>.</li>
            <li>Cole este objeto no ficheiro <code>services/firebase.ts</code>, substituindo os valores de exemplo.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FirebaseErrorDisplay;
