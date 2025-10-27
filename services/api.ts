

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  writeBatch,
  type DocumentData,
  setDoc,
  documentId
} from 'firebase/firestore';
import { db, firebaseError } from './firebase';
import type { Item, ItemType, Note, HtmlView, Video, RangeContent, PokerRange } from '../types';
import { parseRangeText } from '../utils/range-parser';

const getCollection = (collectionName: string) => {
    if (firebaseError) throw new Error(firebaseError);
    if (!db) throw new Error("A base de dados Firestore não está inicializada.");
    return collection(db, collectionName);
};

const mapDocToData = <T extends { id: string }>(doc: DocumentData): T => {
    return { id: doc.id, ...doc.data() } as T;
};

// --- API Functions ---

// Item Endpoints
export const getItems = async (userId: string): Promise<Item[]> => {
    const itemsCol = getCollection('items');
    const q = query(itemsCol, where("ownerId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapDocToData<Item>(doc));
};

export const createItem = async (
    name: string,
    type: ItemType,
    parentId: string | null,
    userId: string,
    options: {
        rangeType?: 'all_positions' | 'blind_vs_blind' | 'open_raise';
        initialContent?: string;
    } = {}
): Promise<Item> => {
    if (firebaseError) throw new Error(firebaseError);
    if (!db) throw new Error("A base de dados Firestore não está inicializada.");
    const batch = writeBatch(db);

    const itemsCol = getCollection('items');

    const newItemRef = doc(itemsCol);
    const newItemData: Omit<Item, 'id'> = {
        name,
        type,
        parentId,
        ownerId: userId,
    };

    if (type === 'rangeFolder' && options.rangeType) {
        newItemData.rangeType = options.rangeType;
    }

    if (type === 'note' || type === 'htmlView' || type === 'pokerRange') {
        const notesCol = getCollection('notes');
        const htmlViewsCol = getCollection('htmlViews');
        const pokerRangesCol = getCollection('pokerRanges');

        const contentRef = doc(
            type === 'note' ? notesCol :
            type === 'htmlView' ? htmlViewsCol :
            pokerRangesCol
        );
        newItemData.contentId = contentRef.id;

        if (type === 'note') {
            const content = options.initialContent ?? `<h1>${name}</h1><p>Comece a escrever aqui...</p>`;
            batch.set(contentRef, { content, ownerId: userId });
        } else if (type === 'htmlView') {
            const htmlContent = options.initialContent ?? '<!-- Comece a escrever o seu HTML aqui -->\n';
            batch.set(contentRef, { htmlContent, ownerId: userId });
        } else if (type === 'pokerRange') {
            const newRange: Omit<PokerRange, 'id'> = { name, rangesByStack: {} };
            batch.set(contentRef, { ...newRange, ownerId: userId });
        }
    }
    
    batch.set(newItemRef, newItemData);
    
    // Se for uma rangeFolder, crie também o seu documento de conteúdo.
    if (type === 'rangeFolder') {
        const rangeContentsCol = getCollection('rangeContents');
        // O ID do conteúdo é o mesmo ID do item da pasta
        const contentRef = doc(rangeContentsCol, newItemRef.id);
        const newRangeContentData = {
            ownerId: userId,
            data: {},
            headerTitle: name,
            headerSubtitle: `Conteúdo para ${name}`
        };
        batch.set(contentRef, newRangeContentData);
    }
    
    await batch.commit();

    return { id: newItemRef.id, ...newItemData };
};

export const updateItem = async (id: string, data: { name?: string; parentId?: string }): Promise<Item> => {
    if (firebaseError) throw new Error(firebaseError);
    if (!db) throw new Error("A base de dados Firestore não está inicializada.");
    
    const itemsCol = getCollection('items');
    const pokerRangesCol = getCollection('pokerRanges');
    const itemRef = doc(itemsCol, id);
    const batch = writeBatch(db);

    batch.update(itemRef, data);

    // If the item name changed, update the corresponding poker range name
    if (data.name) {
        const itemDoc = await getDoc(itemRef);
        const itemData = itemDoc.data() as Item;
        if (itemData.type === 'pokerRange' && itemData.contentId) {
            const rangeRef = doc(pokerRangesCol, itemData.contentId);
            batch.update(rangeRef, { name: data.name });
        }
    }
    
    await batch.commit();
    const updatedDoc = await getDoc(itemRef);
    return mapDocToData<Item>(updatedDoc);
};

export const deleteItem = async (id: string, userId: string): Promise<void> => {
    if (firebaseError) throw new Error(firebaseError);
    if (!db) throw new Error("A base de dados Firestore não está inicializada.");

    const batch = writeBatch(db);
    const allItems = await getItems(userId);
    
    const idsToDelete = new Set<string>();
    const contentIdsToDelete = {
        notes: new Set<string>(),
        htmlViews: new Set<string>(),
        pokerRanges: new Set<string>(),
        rangeContents: new Set<string>(),
    };
    
    const itemsCol = getCollection('items');
    const notesCol = getCollection('notes');
    const htmlViewsCol = getCollection('htmlViews');
    const pokerRangesCol = getCollection('pokerRanges');
    const rangeContentsCol = getCollection('rangeContents');
    const videosCol = getCollection('videos');

    const findChildrenRecursive = (parentId: string) => {
        idsToDelete.add(parentId);
        const item = allItems.find(i => i.id === parentId);
        if (item) {
            if (item.contentId) {
                if (item.type === 'note') contentIdsToDelete.notes.add(item.contentId);
                if (item.type === 'htmlView') contentIdsToDelete.htmlViews.add(item.contentId);
                if (item.type === 'pokerRange') contentIdsToDelete.pokerRanges.add(item.contentId);
            }
            if (item.type === 'rangeFolder') contentIdsToDelete.rangeContents.add(item.id);
            allItems.filter(i => i.parentId === parentId).forEach(child => findChildrenRecursive(child.id));
        }
    };

    findChildrenRecursive(id);

    idsToDelete.forEach(id => batch.delete(doc(itemsCol, id)));
    contentIdsToDelete.notes.forEach(id => batch.delete(doc(notesCol, id)));
    contentIdsToDelete.htmlViews.forEach(id => batch.delete(doc(htmlViewsCol, id)));
    contentIdsToDelete.pokerRanges.forEach(id => batch.delete(doc(pokerRangesCol, id)));
    contentIdsToDelete.rangeContents.forEach(id => batch.delete(doc(rangeContentsCol, id)));
    
    const videosSnapshot = await getDocs(query(videosCol, where("ownerId", "==", userId)));
    videosSnapshot.docs.forEach(videoDoc => {
        const video = mapDocToData<Video>(videoDoc);
        if (video.parentId && idsToDelete.has(video.parentId)) {
            batch.delete(videoDoc.ref);
        }
    });

    await batch.commit();
};

// Note Endpoints
export const getNotes = async (userId: string): Promise<Note[]> => {
    const items = await getItems(userId);
    const noteIds = items.filter(item => item.type === 'note' && item.contentId).map(item => item.contentId!);
    if (noteIds.length === 0) return [];
    
    const notesCol = getCollection('notes');
    const q = query(notesCol, where(documentId(), 'in', noteIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapDocToData<Note>(doc));
};

export const getNote = async (id: string): Promise<Note> => {
    const notesCol = getCollection('notes');
    const docRef = doc(notesCol, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Note not found");
    return mapDocToData<Note>(docSnap);
};

export const updateNote = async (id: string, content: string): Promise<Note> => {
    const notesCol = getCollection('notes');
    const docRef = doc(notesCol, id);
    await updateDoc(docRef, { content });
    return { id, content };
};

// HtmlView Endpoints
export const getHtmlView = async (id: string): Promise<HtmlView> => {
    const htmlViewsCol = getCollection('htmlViews');
    const docRef = doc(htmlViewsCol, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("HTML View not found");
    return mapDocToData<HtmlView>(docSnap);
};

export const updateHtmlView = async (id: string, htmlContent: string): Promise<HtmlView> => {
    const htmlViewsCol = getCollection('htmlViews');
    const docRef = doc(htmlViewsCol, id);
    await updateDoc(docRef, { htmlContent });
    return { id, htmlContent };
};

// Video Endpoints
export const getVideos = async (userId: string): Promise<Video[]> => {
    const videosCol = getCollection('videos');
    const q = query(videosCol, where("ownerId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapDocToData<Video>(doc));
};

export const createVideo = async (title: string, url: string, description: string, parentId: string | null, userId: string): Promise<Video> => {
    const videosCol = getCollection('videos');
    const newVideoData = { title, url, description, parentId, ownerId: userId };
    const docRef = await addDoc(videosCol, newVideoData);
    return { id: docRef.id, ...newVideoData };
};

export const updateVideo = async (id: string, data: { title: string; url: string; description: string }): Promise<Video> => {
    const videosCol = getCollection('videos');
    const docRef = doc(videosCol, id);
    await updateDoc(docRef, data);
    const updatedDoc = await getDoc(docRef);
    return mapDocToData<Video>(updatedDoc);
};

export const deleteVideo = async (id: string): Promise<void> => {
    const videosCol = getCollection('videos');
    await deleteDoc(doc(videosCol, id));
};

// RangeContent Endpoints
export const getRangeContent = async (folderId: string): Promise<RangeContent> => {
    const rangeContentsCol = getCollection('rangeContents');
    const docRef = doc(rangeContentsCol, folderId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return { id: folderId, data: {} };
    }
    return mapDocToData<RangeContent>(docSnap);
};

export const updateRangeContent = async (content: RangeContent, userId: string): Promise<RangeContent> => {
    const rangeContentsCol = getCollection('rangeContents');
    const docRef = doc(rangeContentsCol, content.id);
    const dataToSet = { ...content, ownerId: userId };
    await setDoc(docRef, dataToSet);
    return content;
};

// PokerRange Endpoints
export const getRange = async (id: string): Promise<PokerRange> => {
    const pokerRangesCol = getCollection('pokerRanges');
    const docRef = doc(pokerRangesCol, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        throw new Error("PokerRange content not found");
    }
    const range = mapDocToData<PokerRange>(docSnap);
    for (const stack in range.rangesByStack) {
        const positions = range.rangesByStack[stack as keyof typeof range.rangesByStack];
        if(positions) {
            for (const pos in positions) {
                const posData = positions[pos as keyof typeof positions];
                if (posData && posData.rawText && (!posData.matrix || Object.keys(posData.matrix).length === 0)) {
                    posData.matrix = parseRangeText(typeof posData.rawText === 'string' ? { raise: posData.rawText } : posData.rawText);
                }
            }
        }
    }
    return range;
};

export const updateRange = async (id: string, data: Partial<Omit<PokerRange, 'id'>>): Promise<PokerRange> => {
    const pokerRangesCol = getCollection('pokerRanges');
    const docRef = doc(pokerRangesCol, id);
    await updateDoc(docRef, data);
    const updatedDoc = await getDoc(docRef);
    return mapDocToData<PokerRange>(updatedDoc);
};
