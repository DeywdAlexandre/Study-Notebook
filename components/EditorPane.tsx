import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getNote, updateNote } from '../services/api';
import Spinner from './Spinner';
import type { Item } from '../types';

// Garante que o objeto global Quill esteja disponível
declare global {
    interface Window { Quill: any; }
}

interface EditorPaneProps {
  item: Item;
}

export interface EditorPaneRef {
    handleSave: () => Promise<void>;
}

const EditorPane = forwardRef<EditorPaneRef, EditorPaneProps>(({ item }, ref) => {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  const quillInstanceRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!item.contentId || !quillInstanceRef.current) {
      alert("Editor não está pronto ou falta o ID do conteúdo.");
      return;
    }

    setIsSaving(true);
    try {
      const currentContent = quillInstanceRef.current.root.innerHTML;
      await updateNote(item.contentId, currentContent);
    } catch (err) {
      console.error(err);
      alert('Falha ao guardar a nota.');
    } finally {
      setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  const initEditor = useCallback(async (content: string) => {
    if (editorContainerRef.current && toolbarRef.current && window.Quill) {
        editorContainerRef.current.innerHTML = '';
        
        const editorElement = document.createElement('div');
        editorContainerRef.current.appendChild(editorElement);

        const quill = new window.Quill(editorElement, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarRef.current,
                }
            },
        });
        
        quill.clipboard.dangerouslyPasteHTML(content);
        quillInstanceRef.current = quill;
        setStatus('ready');
    } else {
        // Tenta novamente se o Quill não estiver pronto
        setTimeout(() => initEditor(content), 100);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    setError(null);

    // Limpa a instância anterior do Quill se existir
    if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
    }
    if(editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
    }
    
    if (!item.contentId) {
        setError("Esta nota não tem conteúdo associado.");
        setStatus('error');
        return;
    }

    getNote(item.contentId)
        .then(note => {
            if (isMounted) {
                initEditor(note.content);
            }
        })
        .catch(err => {
            if (isMounted) {
                setError(err.message || "Falha ao carregar o conteúdo da nota.");
                setStatus('error');
            }
        });

    return () => {
        isMounted = false;
    };
  }, [item.id, item.contentId, initEditor]);
  
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100">
        {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center z-20"><Spinner /></div>}
        {status === 'error' && <div className="p-8 text-center text-red-500">{error}</div>}
        
        <div 
            className={`
              h-full flex flex-col
              transition-opacity duration-300
              ${status === 'ready' ? 'opacity-100' : 'opacity-0'}
            `}
        >
            {/* Toolbar - Sticky and full width with a light background */}
            <div ref={toolbarRef} className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-100 border-b border-gray-200 dark:border-gray-300 flex justify-center flex-wrap flex-shrink-0">
                <span className="ql-formats">
                    <select className="ql-font"></select>
                    <select className="ql-header"></select>
                </span>
                <span className="ql-formats">
                    <button className="ql-bold"></button>
                    <button className="ql-italic"></button>
                    <button className="ql-underline"></button>
                    <button className="ql-strike"></button>
                </span>
                <span className="ql-formats">
                    <select className="ql-color"></select>
                    <select className="ql-background"></select>
                </span>
                <span className="ql-formats">
                    <button className="ql-script" value="sub"></button>
                    <button className="ql-script" value="super"></button>
                </span>
                <span className="ql-formats">
                    <button className="ql-list" value="ordered"></button>
                    <button className="ql-list" value="bullet"></button>
                    <button className="ql-indent" value="-1"></button>
                    <button className="ql-indent" value="+1"></button>
                </span>
                <span className="ql-formats">
                    <select className="ql-align"></select>
                </span>
                <span className="ql-formats">
                    <button className="ql-link"></button>
                    <button className="ql-image"></button>
                    <button className="ql-blockquote"></button>
                    <button className="ql-code-block"></button>
                </span>
                <span className="ql-formats">
                    <button className="ql-clean"></button>
                </span>
            </div>

            {/* Scrollable container for the "paper" */}
            <div className="flex-grow overflow-y-auto">
              <div className="p-4 sm:p-8">
                   <div 
                      ref={editorContainerRef}
                      className="max-w-4xl mx-auto rounded-lg shadow-lg graph-paper"
                   >
                   </div>
              </div>
            </div>
        </div>

        <style>{`
            .ql-toolbar {
                border: none !important;
                padding: 12px 8px !important;
            }
            
            .ql-container.ql-snow {
                border: none;
            }

            .ql-editor {
                min-height: 1056px; /* ~A4 height */
                padding: 3rem 4rem !important;
                font-size: 16px;
                line-height: 1.7;
                color: #1f2937;
            }
            .dark .ql-editor {
                color: #d1d5db;
            }

            .graph-paper {
                background-color: #ffffff;
                background-image:
                    linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(128,128,128,0.2) 1px, transparent 1px);
                background-size: 20px 20px;
            }
            .dark .graph-paper {
                background-color: #1f2937;
                background-image:
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
            }
        `}</style>
    </div>
  );
});

export default EditorPane;