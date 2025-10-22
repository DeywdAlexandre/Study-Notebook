import type { Item, ItemType, Note, HtmlView, Video } from '../types';

const LOCAL_STORAGE_KEY = 'study-notebook-data';

interface LocalDB {
  items: Item[];
  notes: Note[];
  htmlViews: HtmlView[];
  videos: Video[];
}

// --- Sample Data ---
const sampleNotes: Note[] = [
    { id: 'content-note-1', content: '<h1>State vs Props</h1><p><strong>Props:</strong> São passadas para o componente (semelhante aos argumentos de uma função).</p><p><strong>State:</strong> É gerido dentro do componente (semelhante às variáveis declaradas dentro de uma função).</p>' },
    { id: 'content-note-2', content: '<h1>Guia de Hooks</h1><ul><li><code>useState</code>: Para gerir o estado.</li><li><code>useEffect</code>: Para efeitos secundários.</li><li><code>useContext</code>: Para o contexto.</li></ul>' },
    { id: 'content-note-3', content: '<h1>Anotações de Reunião</h1><p>Discutimos a nova funcionalidade do editor. Decidimos usar o localStorage para persistência local durante o desenvolvimento.</p>' },
];

const sampleHtmlViews: HtmlView[] = [
    { id: 'content-html-1', htmlContent: `
<style>
  body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #282c34; color: white; }
  .container { display: flex; gap: 10px; background: #3c4049; padding: 20px; border-radius: 8px; }
  .box { width: 80px; height: 80px; background-color: #61dafb; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
</style>
<div class="container">
  <div class="box">1</div>
  <div class="box">2</div>
  <div class="box">3</div>
</div>
<h2 style="margin-top: 20px;">Layout Flexbox Básico</h2>
`},
];

const sampleItems: Item[] = [
    // Notebook Items
    { id: 'folder-1', name: 'Conceitos de React', type: 'folder', parentId: null, ownerId: 'demo-user-id' },
    { id: 'note-1', name: 'State vs Props', type: 'note', parentId: 'folder-1', contentId: 'content-note-1', ownerId: 'demo-user-id' },
    { id: 'note-2', name: 'Guia de Hooks', type: 'note', parentId: 'folder-1', contentId: 'content-note-2', ownerId: 'demo-user-id' },
    { id: 'folder-2', name: 'Demonstrações Web', type: 'folder', parentId: null, ownerId: 'demo-user-id' },
    { id: 'html-1', name: 'Layout Flexbox', type: 'htmlView', parentId: 'folder-2', contentId: 'content-html-1', ownerId: 'demo-user-id' },
    { id: 'folder-3', name: 'Pasta Vazia', type: 'folder', parentId: 'folder-2', ownerId: 'demo-user-id' },
    { id: 'note-3', name: 'Anotações de Reunião', type: 'note', parentId: null, contentId: 'content-note-3', ownerId: 'demo-user-id' },
    // Videoteca Items
    { id: 'vfolder-1', name: 'Tutoriais de Frontend', type: 'videoFolder', parentId: null, ownerId: 'demo-user-id' },
    { id: 'vfolder-2', name: 'Design e UI/UX', type: 'videoFolder', parentId: 'vfolder-1', ownerId: 'demo-user-id' },
];

const sampleVideos: Video[] = [
    { id: 'video-1', title: 'React in 100 Seconds', url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', parentId: 'vfolder-1' },
    { id: 'video-2', title: 'CSS Grid Layout Crash Course', url: 'https://www.youtube.com/watch?v=jV8B24rSN5o', parentId: 'vfolder-2' },
    { id: 'video-3', title: 'HTML Crash Course', url: 'https://www.youtube.com/watch?v=UB1O30fR-EE', parentId: null },
];
// --- End Sample Data ---


const getDB = (): LocalDB => {
  const dbString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (dbString) {
    try {
        const parsed = JSON.parse(dbString);
        if (!parsed.videos) parsed.videos = [];
        // Garante que a propriedade parentId exista nos vídeos
        parsed.videos = parsed.videos.map((v: any) => ({ parentId: null, ...v }));
        return parsed;
    } catch (e) {
        console.error("Failed to parse localStorage data, resetting.", e);
        return { items: [], notes: [], htmlViews: [], videos: [] };
    }
  }
  return { items: [], notes: [], htmlViews: [], videos: [] };
};

const saveDB = (db: LocalDB) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
};

const initializeDB = () => {
  const dbString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!dbString) {
    console.log("Initializing local database with sample data.");
    saveDB({
      items: sampleItems,
      notes: sampleNotes,
      htmlViews: sampleHtmlViews,
      videos: sampleVideos,
    });
  } else {
    // Garante que a base de dados existente tenha a coleção de vídeos e parentIds
    const db = getDB();
    let updated = false;
    if (!db.videos) {
        db.videos = sampleVideos;
        updated = true;
    }
    db.videos = db.videos.map((v: any) => v.hasOwnProperty('parentId') ? v : { ...v, parentId: null });
    
    // Adiciona as pastas de vídeo de exemplo se não existirem
    if (!db.items.some(i => i.type === 'videoFolder')) {
        db.items.push(...sampleItems.filter(i => i.type === 'videoFolder'));
        updated = true;
    }
    
    if (updated) {
        saveDB(db);
    }
  }
};

// Initialize on module load
initializeDB();

// --- API Functions ---

const generateId = (prefix: string) => `${prefix}-${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;

// Item Endpoints
export const getItems = (): Promise<Item[]> => {
  return new Promise((resolve) => {
    const db = getDB();
    resolve(db.items);
  });
};

export const createItem = (name: string, type: ItemType, parentId: string | null): Promise<Item> => {
  return new Promise((resolve) => {
    const db = getDB();
    const newItem: Item = {
      id: generateId(type),
      name,
      type,
      parentId,
      ownerId: 'demo-user-id', // Hardcoded for local dev
    };

    if (type === 'note') {
        const newNote: Note = { id: generateId('content'), content: `<h1>${name}</h1><p>Comece a escrever aqui...</p>` };
        newItem.contentId = newNote.id;
        db.notes.push(newNote);
    } else if (type === 'htmlView') {
        const newHtmlView: HtmlView = { id: generateId('content'), htmlContent: '<!-- Comece a escrever o seu HTML aqui -->\n' };
        newItem.contentId = newHtmlView.id;
        db.htmlViews.push(newHtmlView);
    }
    
    db.items.push(newItem);
    saveDB(db);
    resolve(newItem);
  });
};

export const updateItem = (id: string, data: { name?: string; parentId?: string }): Promise<Item> => {
  return new Promise((resolve, reject) => {
    const db = getDB();
    const itemIndex = db.items.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      db.items[itemIndex] = { ...db.items[itemIndex], ...data };
      saveDB(db);
      resolve(db.items[itemIndex]);
    } else {
      reject(new Error("Item not found"));
    }
  });
};

export const deleteItem = (id: string): Promise<void> => {
    return new Promise((resolve) => {
      let db = getDB();
      const itemToDelete = db.items.find(i => i.id === id);
  
      if (!itemToDelete) {
        return resolve();
      }
  
      const idsToDelete = new Set<string>();
      const findChildrenRecursive = (parentId: string) => {
        idsToDelete.add(parentId);
        const children = db.items.filter(i => i.parentId === parentId);
        children.forEach(child => findChildrenRecursive(child.id));
      };
  
      findChildrenRecursive(id);
  
      const contentIdsToDelete = new Set<string>();
      idsToDelete.forEach(itemId => {
          const item = db.items.find(i => i.id === itemId);
          if (item?.contentId) {
              contentIdsToDelete.add(item.contentId);
          }
      });
  
      db.items = db.items.filter(i => !idsToDelete.has(i.id));
      db.notes = db.notes.filter(n => !contentIdsToDelete.has(n.id));
      db.htmlViews = db.htmlViews.filter(h => !contentIdsToDelete.has(h.id));
      
      // Apaga também os vídeos dentro das pastas de vídeo eliminadas
      if (itemToDelete.type === 'videoFolder') {
        db.videos = db.videos.filter(v => !idsToDelete.has(v.parentId!));
      }
      
      saveDB(db);
      resolve();
    });
};

// Note Endpoints
export const getNote = (id: string): Promise<Note> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const note = db.notes.find(n => n.id === id);
        if (note) {
            resolve(note);
        } else {
            reject(new Error("Note not found"));
        }
    });
};

export const getNotes = (): Promise<Note[]> => {
    return new Promise((resolve) => {
        const db = getDB();
        resolve(db.notes);
    });
};

export const updateNote = (id: string, content: string): Promise<Note> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const noteIndex = db.notes.findIndex(n => n.id === id);
        if (noteIndex > -1) {
            db.notes[noteIndex].content = content;
            saveDB(db);
            resolve(db.notes[noteIndex]);
        } else {
            reject(new Error("Note not found"));
        }
    });
};

// HTML View Endpoints
export const getHtmlView = (id: string): Promise<HtmlView> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const view = db.htmlViews.find(v => v.id === id);
        if (view) {
            resolve(view);
        } else {
            reject(new Error("HTML View not found"));
        }
    });
};

export const updateHtmlView = (id: string, htmlContent: string): Promise<HtmlView> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const viewIndex = db.htmlViews.findIndex(v => v.id === id);
        if (viewIndex > -1) {
            db.htmlViews[viewIndex].htmlContent = htmlContent;
            saveDB(db);
            resolve(db.htmlViews[viewIndex]);
        } else {
            reject(new Error("HTML View not found"));
        }
    });
};

// Video Endpoints
export const getVideos = (): Promise<Video[]> => {
    return new Promise((resolve) => {
        const db = getDB();
        resolve(db.videos);
    });
};

export const createVideo = (title: string, url: string, parentId: string | null): Promise<Video> => {
    return new Promise((resolve) => {
        const db = getDB();
        const newVideo: Video = {
            id: generateId('video'),
            title,
            url,
            parentId,
        };
        db.videos.push(newVideo);
        saveDB(db);
        resolve(newVideo);
    });
};

export const updateVideo = (id: string, data: { title: string, url: string }): Promise<Video> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const videoIndex = db.videos.findIndex(v => v.id === id);
        if (videoIndex > -1) {
            db.videos[videoIndex] = { ...db.videos[videoIndex], ...data };
            saveDB(db);
            resolve(db.videos[videoIndex]);
        } else {
            reject(new Error("Video not found"));
        }
    });
};

export const deleteVideo = (id: string): Promise<void> => {
    return new Promise((resolve) => {
        const db = getDB();
        db.videos = db.videos.filter(v => v.id !== id);
        saveDB(db);
        resolve();
    });
};
