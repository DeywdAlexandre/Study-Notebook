import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getNote, updateNote, createItem } from '../services/api';
import { runAiInteraction } from '../services/gemini';
import Spinner from './Spinner';
import type { Item } from '../types';
import Icon from './Icon';
import AiAssistantModal from './AiAssistantModal';

// Garante que o objeto global Quill esteja disponível
declare global {
    interface Window { Quill: any; }
}

interface EditorPaneProps {
  item: Item | null;
  onItemsChange: () => void;
}

export type AiActionType = 'Resumir' | 'Simplificar' | 'Gerar Perguntas' | 'Corrigir Gramática' | 'Brainstorm de Ideias' | 'Gerar Resumo Visual';

export interface EditorPaneRef {
    handleSave: () => Promise<void>;
    triggerAiAction: (action: AiActionType) => void;
}

const EditorPane = forwardRef<EditorPaneRef, EditorPaneProps>(({ item, onItemsChange }, ref) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const quillInstanceRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  // Estados para o Assistente IA
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiAction, setAiAction] = useState<AiActionType | null>(null);
  const [aiContentType, setAiContentType] = useState<'text' | 'html'>('text');

  const handleSave = useCallback(async () => {
    if (!item || !item.contentId || !quillInstanceRef.current) {
      console.warn("Editor not ready or contentId missing, cannot save.");
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('saving');
    try {
      const currentContent = quillInstanceRef.current.root.innerHTML;
      await updateNote(item.contentId, currentContent);
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000); // Reset status indicator after 2s
    } catch (err) {
      console.error('Failed to save note:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000); // Show error for 3s
    }
  }, [item]);

  const triggerAiAction = useCallback(async (action: AiActionType) => {
    if (!quillInstanceRef.current) return;

    const quill = quillInstanceRef.current;
    const range = quill.getSelection();
    let textToProcess = '';

    if (range && range.length > 0) {
        textToProcess = quill.getText(range.index, range.length);
    } else {
        textToProcess = quill.getText();
    }
    
    if (!textToProcess.trim()) {
        alert("Por favor, selecione algum texto ou escreva algo na nota para usar o assistente.");
        return;
    }

    setAiAction(action);
    setIsAiModalOpen(true);
    setAiLoading(true);
    setAiResponse('');
    
    let prompt = '';
    
    switch(action) {
        case 'Resumir':
            setAiContentType('text');
            prompt = `Resume o seguinte texto de forma concisa:\n\n---\n\n${textToProcess}`;
            break;
        case 'Simplificar':
            setAiContentType('text');
            prompt = `Explica o seguinte conceito de uma forma muito simples, como se fosse para uma criança de 10 anos:\n\n---\n\n${textToProcess}`;
            break;
        case 'Gerar Perguntas':
            setAiContentType('text');
            prompt = `Com base no texto seguinte, cria 3-5 perguntas de revisão para ajudar a estudar o material:\n\n---\n\n${textToProcess}`;
            break;
        case 'Corrigir Gramática':
            setAiContentType('text');
            prompt = `Corrige a gramática e a ortografia do seguinte texto, mantendo o significado original:\n\n---\n\n${textToProcess}`;
            break;
        case 'Brainstorm de Ideias':
            setAiContentType('text');
            prompt = `Com base no tópico central do texto seguinte, gera uma lista de 5 ideias ou conceitos relacionados para explorar:\n\n---\n\n${textToProcess}`;
            break;
        case 'Gerar Resumo Visual':
            setAiContentType('html');
            const noteContent = quill.root.innerHTML;
            prompt = `
TAREFA: Você é um designer e desenvolvedor web. Sua tarefa é criar um resumo visual do conteúdo de uma nota de estudo.

REGRAS:
1. Analise o conteúdo fornecido, que pode ser texto simples ou HTML básico de um editor de texto.
2. Gere um NOVO documento HTML completo, autocontido, que funcione como um resumo visual compacto e esteticamente agradável.
3. O resumo deve capturar os pontos-chave, a estrutura e as ideias principais da nota original. Use elementos como cabeçalhos, listas, caixas de destaque, e uma paleta de cores harmoniosa.
4. Todo o CSS deve ser incluído em uma tag <style> no <head>. Não use arquivos externos.
5. A saída deve ser APENAS o código HTML completo, começando com <!DOCTYPE html> e terminando com </html>. Não inclua nenhum outro texto ou explicação.

CONTEÚDO DA NOTA ORIGINAL:
---
${noteContent}
---
`;
            break;
    }
    
    const response = await runAiInteraction(prompt);

    setAiResponse(response);
    setAiLoading(false);
  }, []);

  useImperativeHandle(ref, () => ({
    handleSave,
    triggerAiAction,
  }));

  // Auto-save on inactivity
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = window.setTimeout(() => {
        handleSave();
      }, 7000); // 7 seconds of inactivity
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, handleSave]);
  
  const handleInsertAiResponse = () => {
    if (quillInstanceRef.current && aiResponse) {
        const quill = quillInstanceRef.current;
        const range = quill.getSelection(true); // 'true' to focus the editor
        // Insere a resposta no final da seleção atual, ou na posição do cursor
        quill.insertText(range.index + range.length, `\n\n--- Resposta da IA ---\n${aiResponse}\n`, 'user');
    }
    setIsAiModalOpen(false);
  }

  const handleSaveAiSummary = async (name: string, content: string) => {
    if (!item) return; // Should not happen if the action is available
    if (!name.trim()) {
        alert("O nome não pode estar vazio.");
        return;
    }
    try {
        await createItem(name, 'htmlView', item.parentId, { initialContent: content });
        alert(`'${name}' foi criado com sucesso!`);
        setIsAiModalOpen(false);
        onItemsChange();
    } catch (e) {
        console.error("Falha ao criar nova visualização HTML:", e);
        alert("Erro: Não foi possível criar a nova visualização.");
    }
  };

  const initEditor = useCallback((content: string) => {
    if (editorContainerRef.current && toolbarRef.current && window.Quill) {
        editorContainerRef.current.innerHTML = '';
        
        const editorElement = document.createElement('div');
        editorContainerRef.current.appendChild(editorElement);

        // Register custom fonts
        const Font = window.Quill.import('formats/font');
        const fontFamilies = ['arial', 'times-new-roman', 'courier-new'];
        Font.whitelist = fontFamilies;
        window.Quill.register(Font, true);

        const quill = new window.Quill(editorElement, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarRef.current,
                    handlers: {
                        'undo': function() { this.quill.history.undo(); },
                        'redo': function() { this.quill.history.redo(); }
                    }
                },
                history: {
                    delay: 1000,
                    maxStack: 500,
                    userOnly: true
                }
            },
        });
        
        quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                setIsDirty(true);
                setSaveStatus('idle'); // When user types, remove 'saved' or 'error' message
            }
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
    if (!item) {
        setStatus('idle');
        if (quillInstanceRef.current) quillInstanceRef.current = null;
        if (editorContainerRef.current) editorContainerRef.current.innerHTML = '';
        return;
    }
    
    let isMounted = true;
    setStatus('loading');
    setError(null);
    setIsDirty(false);
    setSaveStatus('idle');

    if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
    }

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
        // Salva ao desmontar/mudar de nota se houver alterações não guardadas
        if (quillInstanceRef.current && isDirty) {
            handleSave();
        }
    };
  }, [item, initEditor, handleSave]);
  
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Spinner className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500" /> A guardar...</div>;
      case 'saved':
        return <div className="flex items-center gap-2 text-sm text-green-600"><Icon name="Check" size={16}/> Guardado</div>;
      case 'error':
        return <div className="flex items-center gap-2 text-sm text-red-500"><Icon name="AlertCircle" size={16}/> Falha ao guardar</div>;
      case 'idle':
      default:
        if (isDirty) {
          return <div className="text-sm text-slate-500 dark:text-slate-400">Alterações não guardadas</div>;
        }
        return <div className="w-32">&nbsp;</div>; // Placeholder to prevent layout shift
    }
  };

  if (!item) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8">
            <Icon name="NotebookText" size={56} className="mb-4 text-slate-400 dark:text-slate-500" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Selecione uma nota para começar a editar.</h2>
        </div>
    );
  }
  
  return (
    <div className="h-full relative bg-transparent text-slate-900 dark:text-slate-100">
        {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center z-30"><Spinner /></div>}
        {status === 'error' && <div className="p-8 text-center text-red-500">{error}</div>}
        
        <div 
            className={`
              h-full flex flex-col
              transition-opacity duration-300
              ${status === 'ready' ? 'opacity-100' : 'opacity-0'}
            `}
        >
            {/* Toolbar - Sticky and full width with a light background */}
            <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-500 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 relative no-print">
              <div ref={toolbarRef} className="flex justify-center flex-wrap">
                  <span className="ql-formats">
                      <select className="ql-font"></select>
                      <select className="ql-size"></select>
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
                      <button className="ql-undo" title="Desfazer"></button>
                      <button className="ql-redo" title="Refazer"></button>
                  </span>
                  <span className="ql-formats">
                      <button className="ql-clean"></button>
                  </span>
              </div>
              <div className="absolute top-0 right-0 h-full flex items-center pr-4 pointer-events-none">
                {renderSaveStatus()}
              </div>
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

        <AiAssistantModal 
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            isLoading={aiLoading}
            title={aiAction ? `Assistente IA: ${aiAction}` : 'Assistente IA'}
            content={aiResponse}
            contentType={aiContentType}
            onInsert={aiContentType === 'text' ? handleInsertAiResponse : undefined}
            onSaveAsNew={aiContentType === 'html' ? handleSaveAiSummary : undefined}
        />

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
                color: #cbd5e1; /* slate-300 */
            }

            .graph-paper {
                background-color: #ffffff;
                background-image:
                    linear-gradient(rgba(128,128,128,0.2) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(128,128,128,0.2) 1px, transparent 1px);
                background-size: 20px 20px;
            }
            .dark .graph-paper {
                background-color: #1e293b; /* slate-800 */
                background-image:
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
            }
            
            /* Custom Font Styles for Editor Content */
            .ql-font-arial { font-family: "Arial", sans-serif; }
            .ql-font-times-new-roman { font-family: "Times New Roman", serif; }
            .ql-font-courier-new { font-family: "Courier New", monospace; }

            /* Custom Font Names in Toolbar Dropdown */
            .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=arial]::before,
            .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=arial]::before {
                content: 'Arial';
                font-family: "Arial", sans-serif;
            }
            .ql-snow .ql-picker.ql-font .ql-picker-label[data-value='times-new-roman']::before,
            .ql-snow .ql-picker.ql-font .ql-picker-item[data-value='times-new-roman']::before {
                content: 'Times New Roman';
                font-family: "Times New Roman", serif;
            }
            .ql-snow .ql-picker.ql-font .ql-picker-label[data-value='courier-new']::before,
            .ql-snow .ql-picker.ql-font .ql-picker-item[data-value='courier-new']::before {
                content: 'Courier New';
                font-family: "Courier New", monospace;
            }
            
            /* Light Mode: Fix invisible undo/redo icons */
            .ql-snow .ql-toolbar button.ql-undo svg .ql-stroke,
            .ql-snow .ql-toolbar button.ql-redo svg .ql-stroke {
                stroke: #444;
                fill: none;
            }
            
            .dark .ql-snow .ql-toolbar button.ql-undo:hover svg .ql-stroke,
            .dark .ql-snow .ql-toolbar button.ql-redo:hover svg .ql-stroke {
                stroke: #fff;
            }
            
            /* --- Dark Mode Quill Toolbar Styles --- */
            /* General icon and text color */
            .dark .ql-snow.ql-toolbar .ql-stroke {
                stroke: #cbd5e1; /* slate-300 */
            }
            .dark .ql-snow.ql-toolbar .ql-fill {
                fill: #cbd5e1; /* slate-300 */
            }
            .dark .ql-snow.ql-toolbar .ql-picker-label {
                color: #cbd5e1; /* slate-300 */
            }

            /* Hover states */
            .dark .ql-snow.ql-toolbar button:hover .ql-stroke,
            .dark .ql-snow.ql-toolbar .ql-picker-label:hover {
                stroke: #fff;
                color: #fff;
            }
            .dark .ql-snow.ql-toolbar button:hover .ql-fill {
                fill: #fff;
            }

            /* Active / Selected states */
            .dark .ql-snow.ql-toolbar .ql-active .ql-stroke {
                stroke: #a5b4fc; /* indigo-300 */
            }
            .dark .ql-snow.ql-toolbar .ql-active .ql-fill {
                fill: #a5b4fc; /* indigo-300 */
            }
            .dark .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
                color: #a5b4fc; /* indigo-300 */
            }
            .dark .ql-snow.ql-toolbar .ql-active .ql-picker-label {
                color: #a5b4fc; /* indigo-300 */
            }

            /* Dropdown menu styling */
            .dark .ql-snow.ql-toolbar .ql-picker-options {
                background-color: #334155; /* slate-700 */
                border-color: #475569; /* slate-600 */
            }
            .dark .ql-snow.ql-toolbar .ql-picker-item {
                 color: #cbd5e1; /* slate-300 */
            }
            .dark .ql-snow.ql-toolbar .ql-picker-item:hover {
                color: #fff;
            }

            /* --- Print Styles --- */
            @media print {
                .no-print {
                    display: none !important;
                }
                body, .dark, .dark body {
                    background-color: #fff !important;
                }
                main {
                    background: none !important;
                }
                .flex-grow.overflow-y-auto {
                    overflow: visible !important;
                }
                .p-4.sm\\:p-8 {
                    padding: 0 !important;
                }
                .graph-paper {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                    background: none !important;
                }
                .ql-editor {
                    min-height: auto !important;
                    padding: 1.5cm !important;
                    font-size: 12pt !important;
                    line-height: 1.5 !important;
                    color: #000 !important;
                }
            }
        `}</style>
    </div>
  );
});

export default EditorPane;