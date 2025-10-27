

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getHtmlView, updateHtmlView } from '../services/api';
import Spinner from './Spinner';
import type { Item } from '../types';
import Icon from './Icon';

interface HtmlRendererProps {
  item: Item;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({ item }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const fetchContent = useCallback(async () => {
    if (!item.contentId) {
      setError("This view has no content associated with it.");
      setIsLoading(false);
      setHtmlContent("<!-- No content yet. Click Edit HTML to start. -->");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const view = await getHtmlView(item.contentId);
      setHtmlContent(view.htmlContent);
    } catch (err: any) {
      console.error(`Failed to load HTML content for "${item.name}"`, err);
      setError(err.message || "Failed to load HTML view.");
      setHtmlContent("");
    } finally {
      setIsLoading(false);
    }
  }, [item.contentId, item.name]);

  useEffect(() => {
    fetchContent();
    setMode('preview'); // Reset to preview mode when item changes
  }, [item, fetchContent]);

  const handleSave = async () => {
    if (!item.contentId) {
        alert("Cannot save: No content ID.");
        return;
    }
    setIsSaving(true);
    try {
        await updateHtmlView(item.contentId, htmlContent);
        setMode('preview'); // Switch back to preview on save
    } catch (err) {
        console.error(err);
        alert('Failed to save HTML.');
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }
    if (error) {
      return <div className="p-8 text-red-500">{error}</div>;
    }
    return (
        <iframe
          srcDoc={htmlContent}
          title={item.name}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-none bg-white"
        />
    );
  };
  
  const renderEditor = () => (
      <textarea
        ref={textAreaRef}
        value={htmlContent}
        onChange={(e) => setHtmlContent(e.target.value)}
        className="w-full h-full bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-green-400 font-mono p-4 resize-none focus:outline-none"
        placeholder="<html>...</html>"
      />
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <header className="flex-shrink-0 flex items-center justify-end gap-3 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {mode === 'edit' && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
          >
            <Icon name="Save" size={14} />
            {isSaving ? 'A guardar...' : 'Guardar e Ver'}
          </button>
        )}
        <button 
          onClick={() => setMode(prev => prev === 'edit' ? 'preview' : 'edit')}
          className="px-3 py-1.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"
        >
          {mode === 'edit' ? (
            <>
              <Icon name="Eye" size={14} />
              Pré-visualizar
            </>
          ) : (
            <>
              <Icon name="Code" size={14} />
              Editar HTML
            </>
          )}
        </button>
      </header>
      <div className="flex-grow h-0">
        {mode === 'edit' ? renderEditor() : renderContent()}
      </div>
    </div>
  );
};

export default HtmlRenderer;