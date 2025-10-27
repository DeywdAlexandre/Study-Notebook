import type { Item, ItemType, Note, HtmlView, Video, RangeContent, PokerRange, PokerPosition, StackDepth, RangeActions } from '../types';
import { parseRangeText } from '../utils/range-parser';
import { sampleItems, sampleNotes, sampleHtmlViews, sampleVideos, samplePokerRanges } from './data';

const LOCAL_STORAGE_KEY = 'study-notebook-data';

interface LocalDB {
  items: Item[];
  notes: Note[];
  htmlViews: HtmlView[];
  videos: Video[];
  rangeContents: RangeContent[];
  pokerRanges: PokerRange[];
}

const getDB = (): LocalDB => {
  const dbString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (dbString) {
    try {
        const parsed = JSON.parse(dbString);
        // Garante que as novas coleções existam
        if (!parsed.videos) parsed.videos = [];
        if (!parsed.rangeContents) parsed.rangeContents = [];
        if (!parsed.pokerRanges) parsed.pokerRanges = [];
        
        // Garante que as propriedades parentId e description existam
        parsed.videos = parsed.videos.map((v: any) => ({ parentId: null, description: '', ...v }));
        
        return parsed;
    } catch (e) {
        console.error("Failed to parse localStorage data, resetting.", e);
        return { items: [], notes: [], htmlViews: [], videos: [], rangeContents: [], pokerRanges: [] };
    }
  }
  return { items: [], notes: [], htmlViews: [], videos: [], rangeContents: [], pokerRanges: [] };
};

const saveDB = (db: LocalDB) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
};

const processRanges = (ranges: PokerRange[]): PokerRange[] => {
    return ranges.map(range => {
      const newRangesByStack = JSON.parse(JSON.stringify(range.rangesByStack)); // Deep copy to avoid mutation issues
      for (const stack in newRangesByStack) {
        const positions = newRangesByStack[stack as StackDepth];
        if (positions) {
          for (const pos in positions) {
            const data = positions[pos as PokerPosition];
            if (data && data.rawText) {
                const rawText = data.rawText;
                // Migration: if rawText is a string, convert it to the new object format.
                const rawTextObject = typeof rawText === 'string' ? { raise: rawText } : rawText;
                data.rawText = rawTextObject; // Update the data object
                data.matrix = parseRangeText(rawTextObject); // Always parse with the new parser
            }
          }
        }
      }
      return { ...range, rangesByStack: newRangesByStack };
    });
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
      rangeContents: [],
      pokerRanges: processRanges(samplePokerRanges),
    });
  } else {
    // Garante que a base de dados existente tenha as coleções necessárias
    const db = getDB();
    let updated = false;
    
    // Adiciona dados de vídeo se não existirem
    if (!db.videos) {
        db.videos = sampleVideos;
        updated = true;
    }
    db.videos = db.videos.map((v: any) => v.hasOwnProperty('parentId') ? v : { ...v, parentId: null });
    db.videos = db.videos.map((v: any) => v.hasOwnProperty('description') ? v : { ...v, description: '' });
    if (!db.items.some(i => i.type === 'videoFolder')) {
        db.items.push(...sampleItems.filter(i => i.type === 'videoFolder'));
        updated = true;
    }

    // Adiciona dados de range se não existirem
    if (!db.items.some(i => i.type === 'rangeFolder')) {
        db.items.push(...sampleItems.filter(i => i.type === 'rangeFolder'));
        updated = true;
    }
    if (!db.rangeContents) {
        db.rangeContents = [];
        updated = true;
    }
    
    // Adiciona dados de poker range, migra formatos antigos e popula matrizes.
    if (!db.pokerRanges) {
        db.pokerRanges = processRanges(samplePokerRanges);
        updated = true;
    } else {
        const originalRangesString = JSON.stringify(db.pokerRanges);
        let rangesToProcess = db.pokerRanges;

        const needsMigration = rangesToProcess.some((r: any) => r.hasOwnProperty('rawText') || r.hasOwnProperty('ranges'));
        if (needsMigration) {
            console.log("Migrating old poker range formats to stack-based format...");
            rangesToProcess = rangesToProcess.map((oldRange: any) => {
                if (oldRange.hasOwnProperty('rangesByStack')) {
                    if (!oldRange.name && oldRange.id === 'range-1') {
                        oldRange.name = 'Exemplo: RFI Ranges';
                    }
                    return oldRange;
                }
                const newRange: PokerRange = {
                    id: oldRange.id,
                    name: oldRange.name || (oldRange.id === 'range-1' ? 'Exemplo: RFI Ranges' : 'Range Migrado'),
                    rangesByStack: {},
                };
                if (oldRange.hasOwnProperty('ranges')) {
                    newRange.rangesByStack['40'] = oldRange.ranges;
                } else if (oldRange.hasOwnProperty('rawText')) {
                    newRange.rangesByStack['40'] = {
                        'BTN': {
                            rawText: oldRange.rawText, // This will be converted to object in processRanges
                            matrix: oldRange.matrix || {},
                        }
                    };
                }
                return newRange;
            });
        }
        
        const processedRanges = processRanges(rangesToProcess);
        
        if (JSON.stringify(processedRanges) !== originalRangesString) {
             db.pokerRanges = processedRanges;
             updated = true;
        }
    }


    if (!db.items.some(i => i.type === 'pokerRange')) {
        db.items.push(...sampleItems.filter(i => i.id === 'rfolder-3' || i.type === 'pokerRange'));
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

export const createItem = (
    name: string,
    type: ItemType,
    parentId: string | null,
    options: {
        rangeType?: 'all_positions' | 'blind_vs_blind' | 'open_raise';
        initialContent?: string;
    } = {}
): Promise<Item> => {
  return new Promise((resolve) => {
    const db = getDB();
    const newItem: Item = {
      id: generateId(type),
      name,
      type,
      parentId,
      ownerId: 'demo-user-id', // Hardcoded for local dev
    };

    if (type === 'rangeFolder' && options.rangeType) {
        newItem.rangeType = options.rangeType;
    }

    if (type === 'note') {
        const content = options.initialContent ?? `<h1>${name}</h1><p>Comece a escrever aqui...</p>`;
        const newNote: Note = { id: generateId('content'), content };
        newItem.contentId = newNote.id;
        db.notes.push(newNote);
    } else if (type === 'htmlView') {
        const htmlContent = options.initialContent ?? '<!-- Comece a escrever o seu HTML aqui -->\n';
        const newHtmlView: HtmlView = { id: generateId('content'), htmlContent };
        newItem.contentId = newHtmlView.id;
        db.htmlViews.push(newHtmlView);
    } else if (type === 'pokerRange') {
        const newRange: PokerRange = {
            id: generateId('poker-range-content'),
            name: name,
            rangesByStack: {},
        };
        newItem.contentId = newRange.id;
        db.pokerRanges.push(newRange);
    }
    
    db.items.push(newItem);
    saveDB(db as any);
    resolve(newItem);
  });
};

export const updateItem = (id: string, data: { name?: string; parentId?: string }): Promise<Item> => {
  return new Promise((resolve, reject) => {
    const db = getDB();
    const itemIndex = db.items.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      const oldItem = db.items[itemIndex];
      const updatedItem = { ...oldItem, ...data };
      db.items[itemIndex] = updatedItem;

      // If the item name changed, update the corresponding poker range name
      if (data.name && updatedItem.type === 'pokerRange' && updatedItem.contentId) {
          const rangeIndex = db.pokerRanges.findIndex(r => r.id === updatedItem.contentId);
          if (rangeIndex > -1) {
              db.pokerRanges[rangeIndex].name = data.name;
          }
      }

      saveDB(db as any);
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
      db.pokerRanges = db.pokerRanges.filter(p => !contentIdsToDelete.has(p.id));
      
      // Apaga também os vídeos/ranges dentro das pastas eliminadas
      if (itemToDelete.type === 'videoFolder') {
        db.videos = db.videos.filter((v: Video) => !idsToDelete.has(v.parentId!));
      }
      if (itemToDelete.type === 'rangeFolder') {
        db.rangeContents = db.rangeContents.filter((rc: RangeContent) => !idsToDelete.has(rc.id));
      }
      
      saveDB(db as any);
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
            saveDB(db as any);
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
            saveDB(db as any);
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

export const createVideo = (title: string, url: string, description: string, parentId: string | null): Promise<Video> => {
    return new Promise((resolve) => {
        const db = getDB();
        const newVideo: Video = {
            id: generateId('video'),
            title,
            url,
            description,
            parentId,
        };
        db.videos.push(newVideo);
        saveDB(db as any);
        resolve(newVideo);
    });
};

export const updateVideo = (id: string, data: { title: string, url: string, description: string }): Promise<Video> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const videoIndex = db.videos.findIndex(v => v.id === id);
        if (videoIndex > -1) {
            db.videos[videoIndex] = { ...db.videos[videoIndex], ...data };
            saveDB(db as any);
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
        saveDB(db as any);
        resolve();
    });
};

// Range Content Endpoints
export const getRangeContent = (folderId: string): Promise<RangeContent> => {
    return new Promise((resolve) => {
        const db = getDB();
        let content = db.rangeContents.find(rc => rc.id === folderId);
        if (content) {
            resolve(content);
        } else {
            // Create a new one if it doesn't exist
            const newContent: RangeContent = {
                id: folderId,
                data: {}, // Start with empty data
            };
            db.rangeContents.push(newContent);
            saveDB(db);
            resolve(newContent);
        }
    });
};

export const updateRangeContent = (content: RangeContent): Promise<RangeContent> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const contentIndex = db.rangeContents.findIndex(rc => rc.id === content.id);
        if (contentIndex > -1) {
            db.rangeContents[contentIndex] = content;
            saveDB(db);
            resolve(content);
        } else {
            // If it doesn't exist for some reason, add it
            db.rangeContents.push(content);
            saveDB(db);
            resolve(content);
        }
    });
};

// Poker Range (Training) Endpoints
export const getRange = (id: string): Promise<PokerRange> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const range = db.pokerRanges.find(r => r.id === id);
        if (range) {
            // Deep copy and process on get to ensure data is always fresh
            resolve(processRanges([JSON.parse(JSON.stringify(range))])[0]);
        } else {
            reject(new Error("PokerRange content not found"));
        }
    });
};


export const updateRange = (id: string, data: Partial<Omit<PokerRange, 'id'>>): Promise<PokerRange> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const rangeIndex = db.pokerRanges.findIndex(r => r.id === id);
        if (rangeIndex > -1) {
            db.pokerRanges[rangeIndex] = { ...db.pokerRanges[rangeIndex], ...data };
            saveDB(db as any);
            resolve(db.pokerRanges[rangeIndex]);
        } else {
            reject(new Error("PokerRange not found"));
        }
    });
};
