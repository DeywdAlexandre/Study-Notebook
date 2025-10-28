import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileTreeView } from '../components/FileTreeView';
import EditorPane, { EditorPaneRef, AiActionType } from '../components/EditorPane';
import HtmlRenderer from '../components/HtmlRenderer';
import GoogleDocViewer from '../components/GoogleDocViewer';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { getItems, getNotes, getVideos, getRange } from '../services/api';
import type { Item, Note, Video, PokerRange, QuizScenario } from '../types';
import Videoteca from '../components/Videoteca';
import RangesPane from '../components/RangesPane';
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
import TrainingPane from '../components/TrainingPane';
import QuizMode from '../components/QuizMode';
import SessionSidebar, { SessionHand, SessionStats } from '../components/SessionSidebar';
import SessionReportModal from '../components/SessionReportModal';
import { useAuth } from '../hooks/useAuth';
import LoginPage from './LoginPage';
import FirebaseErrorDisplay from '../components/FirebaseErrorDisplay';


type ActiveView = 'notebook' | 'videoteca' | 'ranges' | 'treino' | 'drill';

interface AiAction {
    type: string; // Generic string to accommodate different action types
    label: string;
    description: string;
    icon: React.ComponentProps<typeof Icon>['name'];
    category: 'Compreensão' | 'Criação & Estudo' | 'Melhoria';
}

const noteAiActions: AiAction[] = [
    { type: 'Resumir', label: 'Resumir', description: 'Cria um resumo conciso.', icon: 'BookText', category: 'Compreensão' },
    { type: 'Simplificar', label: 'Simplificar', description: 'Explica conceitos complexos.', icon: 'Baby', category: 'Compreensão' },
    { type: 'Gerar Perguntas', label: 'Gerar Perguntas', description: 'Cria um quiz para revisão.', icon: 'HelpCircle', category: 'Criação & Estudo' },
    { type: 'Brainstorm de Ideias', label: 'Brainstorm', description: 'Gera novas ideias sobre o tópico.', icon: 'Lightbulb', category: 'Criação & Estudo' },
    { type: 'Gerar Resumo Visual', label: 'Resumo Visual (HTML)', description: 'Cria uma página HTML que resume visualmente a nota.', icon: 'MonitorSmartphone', category: 'Criação & Estudo' },
    { type: 'Corrigir Gramática', label: 'Corrigir Gramática', description: 'Revisa ortografia e gramática.', icon: 'PenSquare', category: 'Melhoria' },
];

const noteActionCategories = ['Compreensão', 'Criação & Estudo', 'Melhoria'];

const HomePage: React.FC = () => {
  const { user, loading: authLoading, signOutUser } = useAuth();
  
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizRange, setQuizRange] = useState<PokerRange | null>(null);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedVideoFolder, setSelectedVideoFolder] = useState<Item | null>(null);
  const [selectedRangeFolder, setSelectedRangeFolder] = useState<Item | null>(null);
  const [selectedTrainingItem, setSelectedTrainingItem] = useState<Item | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('notebook');
  const [searchTerm, setSearchTerm] = useState('');

  const { theme, toggleTheme } = useTheme();
  const editorRef = useRef<EditorPaneRef>(null);
  
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  
  // PWA Install state
  const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);


  // State for Session Sidebar and Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionHand[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
      played: 0,
      correct: 0,
      errors: 0,
      accuracy: '0.0',
      streak: 0,
      longestStreak: 0,
  });

  const handleEndSession = useCallback(() => {
      setIsReportModalOpen(true);
  }, []);
  
  const handleCloseReportAndReset = useCallback(() => {
    setIsReportModalOpen(false);
    setSessionHistory([]);
    setSessionStats({ played: 0, correct: 0, errors: 0, accuracy: '0.0', streak: 0, longestStreak: 0 });
    setActiveView('treino');
  }, []);

  const handleHandPlayed = useCallback((result: { scenario: QuizScenario; isCorrect: boolean }) => {
      setSessionStats(prev => {
          const played = prev.played + 1;
          const correct = result.isCorrect ? prev.correct + 1 : prev.correct;
          const errors = !result.isCorrect ? prev.errors + 1 : prev.errors;
          const accuracy = played > 0 ? ((correct / played) * 100).toFixed(1) : '0.0';
          const streak = result.isCorrect ? prev.streak + 1 : 0;
          const longestStreak = Math.max(prev.longestStreak, streak);
          return { played, correct, errors, accuracy, streak, longestStreak };
      });
      setSessionHistory(prev => [...prev, {
          id: prev.length + 1,
          hand: result.scenario.hand,
          position: result.scenario.heroPosition,
          isCorrect: result.isCorrect,
      }]);
  }, []);

  useEffect(() => {
    // Cleanup function to end session when navigating away from drill view
    return () => {
        if (activeView === 'drill') {
            // Reset state if user navigates away without formally ending session
            setSessionHistory([]);
            setSessionStats({ played: 0, correct: 0, errors: 0, accuracy: '0.0', streak: 0, longestStreak: 0 });
        }
    };
  }, [activeView]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setIsAiMenuOpen(false);
      }
    };
    if (isAiMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAiMenuOpen]);
  
  // PWA Installation Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener for when the app is actually installed
    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      const result = await installPromptEvent.prompt();
      console.log(`Install prompt was: ${result.outcome}`);
      // The event can only be used once.
      setInstallPromptEvent(null);
    } else {
      alert(
        "A instalação automática não está disponível no momento.\n\n" +
        "Para instalar, procure a opção 'Instalar Aplicação' ou 'Adicionar ao Ecrã Principal' no menu do seu navegador (geralmente no canto superior direito)."
      );
    }
  };


  const handleNoteAiActionClick = (action: AiActionType) => {
    setIsAiMenuOpen(false);
    editorRef.current?.triggerAiAction(action);
  };

  const fetchAllData = useCallback(async (userId: string) => {
    setLoadingData(true);
    setError(null);
    try {
      const [itemsData, notesData, videosData] = await Promise.all([
        getItems(userId),
        getNotes(userId),
        getVideos(userId),
      ]);
      setItems(itemsData);
      setNotes(notesData);
      setVideos(videosData);
    } catch (err: any) {
      console.error("Falha ao carregar dados do Firestore:", err);
      setError(err.message || "Não foi possível carregar os dados.");
      setItems([]);
      setNotes([]);
      setVideos([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
        fetchAllData(user.uid);
    } else if (!authLoading) { // Only clear data if not in the middle of auth check
        setItems([]);
        setNotes([]);
        setVideos([]);
        setLoadingData(false);
    }
  }, [user, authLoading, fetchAllData]);

  useEffect(() => {
    if (activeView === 'drill' && selectedTrainingItem?.type === 'pokerRange' && selectedTrainingItem.contentId) {
        if (quizRange?.id === selectedTrainingItem.contentId) return;
        
        setLoadingData(true);
        setQuizRange(null);
        getRange(selectedTrainingItem.contentId)
            .then(setQuizRange)
            .catch(err => {
                console.error("Failed to load range for drill", err);
                setError("Could not load range for drill.");
            })
            .finally(() => setLoadingData(false));

    }
  }, [activeView, selectedTrainingItem, quizRange]);
  
  const notebookItems = React.useMemo(() => items.filter(item => item.type === 'folder' || item.type === 'note' || item.type === 'htmlView' || item.type === 'googleDoc'), [items]);
  const videotecaFolders = React.useMemo(() => items.filter(item => item.type === 'videoFolder'), [items]);
  const rangeFolders = React.useMemo(() => items.filter(item => item.type === 'rangeFolder'), [items]);
  const trainingItems = React.useMemo(() => items.filter(item => item.type === 'rangeFolder' || item.type === 'pokerRange'), [items]);

  const itemsById = React.useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

  const filteredNotebookItems = React.useMemo(() => {
    if (!searchTerm) return notebookItems;
    const lowercasedFilter = searchTerm.toLowerCase();
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
    const matchingItems = notebookItems.filter(item => {
        if (item.name.toLowerCase().includes(lowercasedFilter)) return true;
        if (item.type === 'note' && item.contentId) {
            const note = notes.find(n => n.id === item.contentId);
            if (note && stripHtml(note.content).toLowerCase().includes(lowercasedFilter)) return true;
        }
        return false;
    });
    const visibleItemIds = new Set<string>();
    matchingItems.forEach(item => {
      let currentItem: Item | undefined = item;
      while (currentItem) {
        visibleItemIds.add(currentItem.id);
        currentItem = currentItem.parentId ? itemsById.get(currentItem.parentId) : undefined;
      }
    });
    return notebookItems.filter(item => visibleItemIds.has(item.id));
  }, [notebookItems, notes, searchTerm, itemsById]);

  const filterFoldersByName = (folders: Item[]) => {
    if (!searchTerm) return folders;
    const lowercasedFilter = searchTerm.toLowerCase();
    const matchingItems = folders.filter(item => item.name.toLowerCase().includes(lowercasedFilter));
    const visibleItemIds = new Set<string>();
    matchingItems.forEach(item => {
      let currentItem: Item | undefined = item;
      while (currentItem) {
        visibleItemIds.add(currentItem.id);
        currentItem = currentItem.parentId ? itemsById.get(currentItem.parentId) : undefined;
      }
    });
    return folders.filter(item => visibleItemIds.has(item.id));
  };
  
  const filteredVideotecaFolders = React.useMemo(() => filterFoldersByName(videotecaFolders), [videotecaFolders, searchTerm, itemsById]);
  const filteredRangeFolders = React.useMemo(() => filterFoldersByName(rangeFolders), [rangeFolders, searchTerm, itemsById]);
  const filteredTrainingItems = React.useMemo(() => {
    if (!searchTerm) return trainingItems;
    const lowercasedFilter = searchTerm.toLowerCase();
    const matchingItems = trainingItems.filter(item => item.name.toLowerCase().includes(lowercasedFilter));
    const visibleItemIds = new Set<string>();
    matchingItems.forEach(item => {
      let currentItem: Item | undefined = item;
      while (currentItem) {
        visibleItemIds.add(currentItem.id);
        currentItem = currentItem.parentId ? itemsById.get(currentItem.parentId) : undefined;
      }
    });
    return trainingItems.filter(item => visibleItemIds.has(item.id));
  }, [trainingItems, searchTerm, itemsById]);


  const filteredVideos = React.useMemo(() => {
    const videosInFolder = selectedVideoFolder
      ? videos.filter(video => video.parentId === selectedVideoFolder.id)
      : videos;

    if (!searchTerm) return videosInFolder;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return videosInFolder.filter(video => video.title.toLowerCase().includes(lowercasedFilter) || video.description?.toLowerCase().includes(lowercasedFilter));
  }, [videos, searchTerm, selectedVideoFolder]);

  const handleDataChange = useCallback(() => {
    if (user?.uid) {
        fetchAllData(user.uid);
    }
  }, [user, fetchAllData]);

  const renderContentPane = () => {
    switch (activeView) {
        case 'ranges':
            return <RangesPane selectedFolder={selectedRangeFolder} />;
        case 'treino':
            return <TrainingPane selectedItem={selectedTrainingItem} onDataChange={handleDataChange}/>;
        case 'drill':
            if (!selectedTrainingItem || selectedTrainingItem.type !== 'pokerRange') {
                return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8">
                        <Icon name="MousePointerClick" size={56} className="mb-4 text-slate-400 dark:text-slate-500" />
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Selecione um Range para o Drill</h2>
                        <p className="mt-2">Use a barra lateral para selecionar um range de treino.</p>
                    </div>
                );
            }
            if (loadingData) {
                return <div className="h-full flex items-center justify-center"><Spinner /></div>;
            }
            if (!quizRange) {
                return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8">
                        <Icon name="AlertTriangle" size={56} className="mb-4 text-amber-500" />
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Não foi possível carregar o range</h2>
                        <p className="mt-2">Ocorreu um erro ao carregar o range selecionado.</p>
                    </div>
                );
            }
            return <QuizMode range={quizRange} onHandPlayed={handleHandPlayed} sessionStats={{ correct: sessionStats.correct, total: sessionStats.played, accuracy: sessionStats.accuracy }} />;
        case 'videoteca':
            return <Videoteca videos={filteredVideos} onDataChange={handleDataChange} selectedFolderId={selectedVideoFolder?.id ?? null} />;
        case 'notebook':
            if (!selectedItem || selectedItem.type === 'folder' || selectedItem.type === 'videoFolder' || selectedItem.type === 'rangeFolder') {
                return <EditorPane ref={editorRef} item={null} onItemsChange={handleDataChange} />;
            }
            switch (selectedItem.type) {
                case 'note':
                    return <EditorPane ref={editorRef} item={selectedItem} onItemsChange={handleDataChange} />;
                case 'htmlView':
                    return <HtmlRenderer item={selectedItem} />;
                case 'googleDoc':
                    return <GoogleDocViewer item={selectedItem} />;
                default:
                    return <EditorPane ref={editorRef} item={null} onItemsChange={handleDataChange}/>;
            }
        default:
            return null;
    }
  };
  
  const renderHeaderActions = () => {
    if (activeView !== 'notebook' || !selectedItem || selectedItem.type !== 'note') return null;
    return <button onClick={() => editorRef.current?.handleSave()} className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Guardar</button>;
  }

  const getHeaderTitle = () => {
    switch (activeView) {
        case 'videoteca':
            return selectedVideoFolder ? selectedVideoFolder.name : 'Videoteca';
        case 'notebook':
            return selectedItem ? selectedItem.name : 'Notebook';
        case 'ranges':
            return selectedRangeFolder ? selectedRangeFolder.name : 'HRC';
        case 'treino':
            return selectedTrainingItem ? selectedTrainingItem.name : 'Editor de Ranges';
        case 'drill':
            return `Drill: ${quizRange?.name || selectedTrainingItem?.name || 'Selecione um Range'}`;
        default:
            return 'Notebook';
    }
  }
  
  const NavButton: React.FC<{ view: ActiveView, icon: React.ComponentProps<typeof Icon>['name'], label: string }> = ({ view, icon, label }) => (
      <button 
        onClick={() => setActiveView(view)}
        className={`flex-grow flex items-center justify-center gap-2 p-3 text-base transition-colors rounded-md ${activeView === view ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
      >
        <Icon name={icon} size={16} />
        {label}
      </button>
  );
  
  const handlePrint = () => {
    window.print();
  };
  
  const showPrintButton = activeView === 'notebook' && selectedItem?.type === 'note';
  const showAiButton = activeView === 'notebook' && selectedItem?.type === 'note';

  const showSidebar = ['notebook', 'videoteca', 'ranges', 'treino', 'drill'].includes(activeView);
  
  if (error && error.includes('Configuração do Firebase em falta')) {
      return <FirebaseErrorDisplay error={error} />;
  }
  
  if (authLoading) {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <Spinner />
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center z-30 shadow-sm no-print">
        <div className="w-80 flex-shrink-0 flex items-center gap-3">
            <Icon name="BrainCircuit" className="text-indigo-600" size={32}/>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">All-in One PokerAce</h1>
        </div>
        <div className="flex-grow text-center px-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 truncate">{getHeaderTitle()}</h2>
        </div>
        <div className="w-80 flex-shrink-0 flex items-center justify-end gap-2 pr-2">
            {renderHeaderActions()}
            {showAiButton && (
                <div className="relative">
                    <button
                        onClick={() => setIsAiMenuOpen(prev => !prev)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Assistente IA"
                    >
                        <Icon name="Sparkles" size={20} className="text-indigo-500" />
                    </button>
                    {isAiMenuOpen && (
                        <div ref={aiMenuRef} className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-40 p-2 space-y-1">
                           {noteActionCategories.map((category, index) => (
                                <div key={category}>
                                    {index > 0 && <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />}
                                    <h4 className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{category}</h4>
                                    {noteAiActions.filter(a => a.category === category).map(action => (
                                        <button
                                            key={action.type}
                                            onClick={() => handleNoteAiActionClick(action.type as AiActionType)}
                                            className="w-full text-left p-2 flex items-start gap-3 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <Icon name={action.icon} size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm leading-tight">{action.label}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-snug">{action.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                           ))}
                        </div>
                    )}
                </div>
            )}
            {showPrintButton && (
                <button
                    onClick={handlePrint}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Imprimir Nota"
                >
                    <Icon name="Printer" size={20} />
                </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
            >
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={20} />
            </button>
            <button
              onClick={handleInstallClick}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Instalar Aplicação"
            >
              <Icon name="Download" size={20} />
            </button>
            <button
              onClick={signOutUser}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Sair"
            >
              <Icon name="LogOut" size={20} />
            </button>
        </div>
      </header>
      <div className="flex-grow flex overflow-hidden">
        <aside className="w-64 md:w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col no-print">
          <nav className="flex-shrink-0 flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-900/50">
             <NavButton view="notebook" icon="Notebook" label="Notebook" />
             <NavButton view="videoteca" icon="Youtube" label="Videoteca" />
             <NavButton view="ranges" icon="Target" label="HRC" />
             <NavButton view="treino" icon="Dumbbell" label="Treino" />
             <NavButton view="drill" icon="Swords" label="Drill" />
          </nav>
          {showSidebar && (
             <div className="flex-grow overflow-hidden p-2 flex flex-col">
                <div className="flex-shrink-0 mb-2">
                    <SearchBar value={searchTerm} onChange={setSearchTerm} />
                </div>
                {loadingData && <div className="p-4 flex justify-center items-center h-full"><Spinner /></div>}
                
                {error && !error.includes('Configuração do Firebase em falta') && <div className="p-4 text-red-500 text-sm">{error}</div>}
                
                {!loadingData && !error && activeView === 'notebook' && (
                    <FileTreeView viewType="notebook" items={filteredNotebookItems} onSelectItem={setSelectedItem} selectedItem={selectedItem} onItemsChange={handleDataChange} />
                )}
                {!loadingData && !error && activeView === 'videoteca' && (
                    <FileTreeView viewType="videoteca" items={filteredVideotecaFolders} onSelectItem={setSelectedVideoFolder} selectedItem={selectedVideoFolder} onItemsChange={handleDataChange} />
                )}
                {!loadingData && !error && activeView === 'ranges' && (
                    <FileTreeView viewType="ranges" items={filteredRangeFolders} onSelectItem={setSelectedRangeFolder} selectedItem={selectedRangeFolder} onItemsChange={handleDataChange} />
                )}
                {!loadingData && !error && (activeView === 'treino' || activeView === 'drill') && (
                    <FileTreeView viewType="treino" items={filteredTrainingItems} onSelectItem={setSelectedTrainingItem} selectedItem={selectedTrainingItem} onItemsChange={handleDataChange} />
                )}
            </div>
          )}
        </aside>
        <main className="flex-grow bg-slate-50 dark:bg-slate-900 relative">
          {renderContentPane()}
        </main>
        {activeView === 'drill' && (
          <aside className="w-72 flex-shrink-0 border-l border-slate-700">
              <SessionSidebar 
                  history={sessionHistory}
                  stats={sessionStats}
                  onEndSession={handleEndSession}
                  isActive={true}
              />
          </aside>
        )}
      </div>

      <SessionReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportAndReset}
        stats={sessionStats}
      />
    </div>
  );
};

export default HomePage;