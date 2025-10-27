

import React, { useState } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  title: string;
  content: string;
  onInsert?: () => void;
  onSaveAsNew?: (name: string, content: string) => void;
  contentType?: 'text' | 'html';
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  title,
  content,
  onInsert,
  onSaveAsNew,
  contentType = 'text',
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(err => {
        console.error("Failed to copy text:", err);
        alert("Falha ao copiar texto.");
    });
  };

  const handleSaveAsNewClick = () => {
    const name = prompt("Qual o nome para a nova visualização HTML?", "Resumo de IA");
    if (name && onSaveAsNew) {
      onSaveAsNew(name, content);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={20} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <Icon name="X" size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <Spinner />
                <p className="mt-4">A IA está a pensar...</p>
            </div>
          ) : contentType === 'html' ? (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 mb-2">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${viewMode === 'preview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                  >
                    Pré-visualização
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${viewMode === 'code' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                  >
                    Código
                  </button>
                </nav>
              </div>
              <div className="flex-grow h-0 bg-slate-50 dark:bg-slate-900 rounded-md">
                {viewMode === 'preview' ? (
                  <iframe srcDoc={content} title="AI Preview" className="w-full h-full border rounded-md bg-white" />
                ) : (
                  <textarea
                    readOnly
                    value={content}
                    className="w-full h-full font-mono text-xs bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-md p-2 resize-none focus:outline-none"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap font-normal">
                {content}
            </div>
          )}
        </main>

        {!isLoading && content && (
            <footer className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 flex items-center gap-2"
                >
                    <Icon name={copyStatus === 'copied' ? "Check" : "Copy"} size={16} />
                    {copyStatus === 'copied' ? 'Copiado!' : 'Copiar'}
                </button>
                {contentType === 'text' && onInsert && (
                    <button
                        type="button"
                        onClick={onInsert}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
                    >
                        <Icon name="Plus" size={16} />
                        Inserir na Nota
                    </button>
                )}
                {contentType === 'html' && onSaveAsNew && (
                    <button
                        type="button"
                        onClick={handleSaveAsNewClick}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
                    >
                        <Icon name="Save" size={16} />
                        Salvar como Nova Visualização
                    </button>
                )}
            </footer>
        )}
      </div>
      <style>{`
        .prose {
            font-size: 1rem;
            line-height: 1.7;
        }
        .prose h1, .prose h2, .prose h3 {
            margin-bottom: 0.5em;
        }
        .prose p {
            margin-bottom: 1em;
        }
        .prose ul, .prose ol {
            padding-left: 1.5em;
            margin-bottom: 1em;
        }
        .prose li > p {
            margin: 0;
        }
      `}</style>
    </div>
  );
};

export default AiAssistantModal;