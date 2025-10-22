import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileTreeView } from '../components/FileTreeView';
import EditorPane, { EditorPaneRef } from '../components/EditorPane';
import HtmlRenderer, { HtmlRendererRef } from '../components/HtmlRenderer';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { getItems, getNotes, getVideos } from '../services/api';
import type { Item, Note, Video } from '../types';
import Videoteca from '../components/Videoteca';
import SearchBar from '../components/SearchBar';

const WelcomePane: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
        <Icon name="BookOpen" size={64} className="mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold">Bem-vindo ao seu Caderno de Estudos</h2>
        <p className="mt-2 max-w-md">Selecione um item no painel esquerdo para o visualizar ou editar. Também pode criar novas notas, visualizações HTML ou pastas usando os ícones na barra lateral.</p>
    </div>
)

type ActiveView = 'notebook' | 'videoteca';

const HomePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedVideoFolder, setSelectedVideoFolder] = useState<Item | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHtmlEditing, setIsHtmlEditing] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('notebook');
  const [searchTerm, setSearchTerm] = useState('');


  const { signOutUser, user } = useAuth();
  const editorRef = useRef<EditorPaneRef>(null);
  const htmlRef = useRef<HtmlRendererRef>(null);


  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, notesData, videosData] = await Promise.all([
        getItems(),
        getNotes(),
        getVideos(),
      ]);
      setItems(itemsData);
      setNotes(notesData);
      setVideos(videosData);
    } catch (err: any) {
      console.error("Falha ao carregar dados da API local:", err);
      setError(err.message || "Não foi possível carregar os dados.");
      setItems([]);
      setNotes([]);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
  
  useEffect(() => {
    setIsHtmlEditing(false);
  }, [selectedItem]);

  const notebookItems = React.useMemo(() => items.filter(item => item.type !== 'videoFolder'), [items]);
  const videotecaFolders = React.useMemo(() => items.filter(item => item.type === 'videoFolder'), [items]);

  // FIX: Create a single map of all items to ensure correct parent lookups, preventing type errors.
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

  const filteredVideotecaFolders = React.useMemo(() => {
    if (!searchTerm) return videotecaFolders;
    const lowercasedFilter = searchTerm.toLowerCase();
    const matchingItems = videotecaFolders.filter(item => item.name.toLowerCase().includes(lowercasedFilter));
    const visibleItemIds = new Set<string>();
    matchingItems.forEach(item => {
      let currentItem: Item | undefined = item;
      while (currentItem) {
        visibleItemIds.add(currentItem.id);
        currentItem = currentItem.parentId ? itemsById.get(currentItem.parentId) : undefined;
      }
    });
    return videotecaFolders.filter(item => visibleItemIds.has(item.id));
  }, [videotecaFolders, searchTerm, itemsById]);

  const filteredVideos = React.useMemo(() => {
    const videosInFolder = selectedVideoFolder
      ? videos.filter(video => video.parentId === selectedVideoFolder.id)
      : videos;

    if (!searchTerm) return videosInFolder;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return videosInFolder.filter(video => video.title.toLowerCase().includes(lowercasedFilter));
  }, [videos, searchTerm, selectedVideoFolder]);


  const handleDataChange = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  const renderContentPane = () => {
    if (activeView === 'videoteca') {
        return <Videoteca videos={filteredVideos} onDataChange={handleDataChange} selectedFolderId={selectedVideoFolder?.id ?? null} />;
    }

    if (!selectedItem || selectedItem.type === 'videoFolder') {
      return <WelcomePane />;
    }
    switch (selectedItem.type) {
      case 'note':
        return <EditorPane ref={editorRef} item={selectedItem} />;
      case 'htmlView':
        return <HtmlRenderer ref={htmlRef} item={selectedItem} isEditing={isHtmlEditing} onSaveComplete={() => setIsHtmlEditing(false)} />;
      case 'folder':
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <Icon name="Folder" size={64} className="mb-4 text-yellow-500" />
                <h2 className="text-2xl font-semibold">{selectedItem.name}</h2>
                <p className="mt-2">Isto é uma pasta. Selecione um ficheiro dentro dela para ver o conteúdo.</p>
            </div>
        );
      default:
        return <WelcomePane />;
    }
  };
  
  const renderHeaderActions = () => {
    if (activeView !== 'notebook' || !selectedItem || selectedItem.type === 'videoFolder') return null;

    if (selectedItem.type === 'note') {
        return <button onClick={() => editorRef.current?.handleSave()} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Guardar</button>;
    }

    if (selectedItem.type === 'htmlView') {
        return isHtmlEditing ? (
            <button onClick={() => htmlRef.current?.handleSave()} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Guardar e Ver</button>
        ) : (
            <button onClick={() => setIsHtmlEditing(true)} className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">Editar HTML</button>
        )
    }
    return null;
  }

  const getHeaderTitle = () => {
    if (activeView === 'videoteca') {
        return selectedVideoFolder ? selectedVideoFolder.name : 'Videoteca';
    }
    if (activeView === 'notebook' && selectedItem) {
        return selectedItem.name;
    }
    return 'Study Notebook';
  }
  
  const NavButton: React.FC<{ view: ActiveView, icon: React.ComponentProps<typeof Icon>['name'], label: string }> = ({ view, icon, label }) => (
      <button 
        onClick={() => setActiveView(view)}
        className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors rounded-t-md ${activeView === view ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
      >
        <Icon name={icon} size={16} />
        {label}
      </button>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-2 flex items-center z-10">
        <div className="w-80 flex-shrink-0 flex items-center gap-2">
            <Icon name="BookMarked" className="text-blue-600 ml-2"/>
            <h1 className="text-xl font-bold">Study Notebook</h1>
        </div>
        <div className="flex-grow text-center px-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">{getHeaderTitle()}</h2>
        </div>
        <div className="w-80 flex-shrink-0 flex items-center justify-end gap-4 pr-2">
            {renderHeaderActions()}
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">{user?.email}</span>
                <button onClick={signOutUser} className="flex items-center gap-1.5 text-sm p-1.5 border border-transparent rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Sign Out">
                    <Icon name="LogOut" size={16}/>
                </button>
            </div>
        </div>
      </header>
      <div className="flex-grow flex overflow-hidden">
        <aside className="w-64 md:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
          <nav className="flex-shrink-0 flex gap-2 p-2 bg-gray-100 dark:bg-gray-950">
             <NavButton view="notebook" icon="Notebook" label="Notebook" />
             <NavButton view="videoteca" icon="Youtube" label="Videoteca" />
          </nav>
          <div className="flex-grow overflow-hidden p-2 bg-white dark:bg-gray-800 flex flex-col">
            <div className="flex-shrink-0 mb-2">
                <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>
            {loading && <div className="p-4 flex justify-center items-center h-full"><Spinner /></div>}
            {error && <div className="p-4 text-red-500 text-sm">{error}</div>}
            
            {!loading && !error && activeView === 'notebook' && (
                <FileTreeView viewType="notebook" items={filteredNotebookItems} onSelectItem={setSelectedItem} selectedItem={selectedItem} onItemsChange={handleDataChange} />
            )}
            {!loading && !error && activeView === 'videoteca' && (
                <FileTreeView viewType="videoteca" items={filteredVideotecaFolders} onSelectItem={setSelectedVideoFolder} selectedItem={selectedVideoFolder} onItemsChange={handleDataChange} />
            )}
          </div>
        </aside>
        <main className="flex-grow bg-gray-50 dark:bg-gray-900/50 p-4">
          {renderContentPane()}
        </main>
      </div>
    </div>
  );
};

export default HomePage;