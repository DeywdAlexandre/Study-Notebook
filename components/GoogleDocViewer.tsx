import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getGoogleDoc, updateGoogleDoc } from '../services/api';
import Spinner from './Spinner';
import type { Item } from '../types';
import Icon from './Icon';
import { transformGoogleDocUrl } from '../utils/gdoc';

interface GoogleDocViewerProps {
  item: Item;
}

const GoogleDocViewer: React.FC<GoogleDocViewerProps> = ({ item }) => {
  const [docUrl, setDocUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger iframe refresh

  // Callback to refresh the iframe content
  const handleRefresh = useCallback(() => {
    // Incrementing the key will cause the iframe component to re-mount
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Effect to automatically refresh when the window gains focus
  useEffect(() => {
    window.addEventListener('focus', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
    };
  }, [handleRefresh]);

  const fetchContent = useCallback(async () => {
    if (!item.contentId) {
      setError("This Google Doc item has no content associated with it.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const doc = await getGoogleDoc(item.contentId);
      setDocUrl(doc.url);
      setInputUrl(doc.url);
      setRefreshKey(0); // Reset refresh key on new item load
    } catch (err: any) {
      console.error(`Failed to load Google Doc content for "${item.name}"`, err);
      setError(err.message || "Failed to load Google Doc.");
      setDocUrl("");
      setInputUrl("");
    } finally {
      setIsLoading(false);
    }
  }, [item.contentId, item.name]);

  useEffect(() => {
    fetchContent();
  }, [item, fetchContent]);

  const handleSave = async () => {
    if (!item.contentId) {
        alert("Cannot save: No content ID.");
        return;
    }
    setIsSaving(true);
    try {
        await updateGoogleDoc(item.contentId, inputUrl);
        setDocUrl(inputUrl); // Update the displayed URL
        handleRefresh(); // Refresh the iframe after saving a new URL
    } catch (err) {
        console.error(err);
        alert('Failed to save Google Doc URL.');
    } finally {
        setIsSaving(false);
    }
  };
  
  const transformedUrls = useMemo(() => transformGoogleDocUrl(docUrl), [docUrl]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner /></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="flex-shrink-0 flex items-center justify-between gap-3 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <div className="flex-grow flex items-center gap-2">
            <Icon name="Link" size={16} className="text-slate-500 ml-2" />
            <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Cole o link de partilha do seu Google Doc aqui..."
                className="w-full text-sm bg-transparent focus:outline-none text-slate-700 dark:text-slate-300"
            />
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSave}
                disabled={isSaving || inputUrl === docUrl}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <Icon name="Save" size={14} />
                {isSaving ? 'A guardar...' : 'Guardar Link'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={!transformedUrls?.embedUrl}
              className="px-3 py-1.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Atualizar Visualização"
            >
              <Icon name="RotateCw" size={14} />
              Atualizar
            </button>
            {transformedUrls?.originalUrl && (
                 <a 
                    href={transformedUrls.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 flex items-center gap-2"
                 >
                    <Icon name="ExternalLink" size={14} />
                    Editar no Google Docs
                </a>
            )}
        </div>
      </header>
      <div className="flex-grow h-0 p-4">
        {transformedUrls?.embedUrl ? (
             <iframe
                key={refreshKey} // Force re-mount on refresh
                src={transformedUrls.embedUrl}
                title={item.name}
                className="w-full h-full border rounded-md shadow-inner bg-white"
            />
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8 bg-white dark:bg-slate-800 rounded-md">
                <Icon name="FileWarning" size={56} className="mb-4 text-slate-400 dark:text-slate-500" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                    {docUrl ? "Link do Google Doc inválido" : "Nenhum Google Doc associado"}
                </h2>
                <p className="mt-2 max-w-md">
                   {docUrl 
                        ? "O link que inseriu não parece ser um link válido de um Google Doc. Por favor, verifique e tente novamente."
                        : "Para começar, cole o link de partilha do seu Google Doc na barra no topo e clique em 'Guardar Link'."
                   }
                </p>
                 <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 max-w-md">
                   Lembre-se: Para que o documento apareça aqui, as permissões de partilha no Google Docs devem estar definidas como "Qualquer pessoa com o link pode ver".
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDocViewer;