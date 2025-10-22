import React, { useState } from 'react';
import type { Item, ItemType } from '../types';
import Icon from './Icon';
import { createItem, updateItem, deleteItem } from '../services/api';

interface FileTreeItemProps {
  item: Item;
  level: number;
  onSelect: (item: Item) => void;
  selectedId: string | null;
  onAdd: (type: ItemType, parentId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  viewType: 'notebook' | 'videoteca';
}

const ItemIcon: React.FC<{ type: ItemType; isOpen?: boolean }> = ({ type, isOpen }) => {
  if (type === 'folder' || type === 'videoFolder') {
    return <Icon name={isOpen ? 'FolderOpen' : 'Folder'} className="text-yellow-500" size={18} />;
  }
  if (type === 'note') {
    return <Icon name="FileText" className="text-blue-500" size={18} />;
  }
  if (type === 'htmlView') {
    return <Icon name="Code" className="text-green-500" size={18} />;
  }
  return null;
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({ item, level, onSelect, selectedId, onAdd, onRename, onDelete, viewType }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const isSelected = item.id === selectedId;

  const handleToggle = () => {
    if (item.type === 'folder' || item.type === 'videoFolder') {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = () => {
    onSelect(item);
  };
  
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
        onRename(item.id, newName.trim());
        setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem a certeza que quer apagar "${item.name}"? Isto não pode ser desfeito.`)) {
        onDelete(item.id);
    }
  }

  const renderFolderActions = () => {
    if (viewType === 'notebook') {
      return (
        <>
            <button onClick={(e) => { e.stopPropagation(); onAdd('note', item.id) }} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title="Nova Nota"><Icon name="FileText" size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onAdd('htmlView', item.id) }} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title="Nova Visualização HTML"><Icon name="Code" size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onAdd('folder', item.id) }} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title="Nova Pasta"><Icon name="FolderPlus" size={14} /></button>
        </>
      );
    }
    if (viewType === 'videoteca') {
      return (
        <button onClick={(e) => { e.stopPropagation(); onAdd('videoFolder', item.id) }} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title="Nova Pasta de Vídeo"><Icon name="FolderPlus" size={14} /></button>
      );
    }
    return null;
  }

  return (
    <div>
      <div
        onClick={handleSelect}
        className={`flex items-center p-1.5 rounded-md cursor-pointer group ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="w-5 flex-shrink-0">
         {(item.type === 'folder' || item.type === 'videoFolder') && <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={16} className="text-gray-500" />}
        </div>
        <ItemIcon type={item.type} isOpen={isOpen} />
        {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex-grow ml-2">
                <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    autoFocus
                    className="w-full text-sm bg-transparent outline-none ring-1 ring-blue-500 rounded px-1"
                />
            </form>
        ) : (
             <span className="ml-2 text-sm text-gray-800 dark:text-gray-200 truncate flex-grow">{item.name}</span>
        )}
       
        <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 pr-1 transition-opacity">
            {(item.type === 'folder' || item.type === 'videoFolder') && renderFolderActions()}
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title="Renomear"><Icon name="Pencil" size={14} /></button>
            <button onClick={handleDelete} className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800" title="Apagar"><Icon name="Trash2" size={14} className="text-red-500" /></button>
        </div>
      </div>
      {isOpen && (item.type === 'folder' || item.type === 'videoFolder') && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem key={child.id} item={child} level={level + 1} onSelect={onSelect} selectedId={selectedId} onAdd={onAdd} onRename={onRename} onDelete={onDelete} viewType={viewType}/>
          ))}
        </div>
      )}
    </div>
  );
};


interface FileTreeViewProps {
  items: Item[];
  onSelectItem: (item: Item | null) => void;
  selectedItem: Item | null;
  onItemsChange: () => void;
  viewType: 'notebook' | 'videoteca';
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ items, onSelectItem, selectedItem, onItemsChange, viewType }) => {
  const { onAdd, onRename, onDelete } = useItemMutations(onItemsChange);

  const buildTree = (list: Item[], parentId: string | null = null): Item[] => {
    return list
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(list, item.id)
      }));
  };

  const tree = buildTree(items, null);

  const renderHeader = () => {
    if (viewType === 'notebook') {
        return (
            <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                <button onClick={() => onAdd('note', null)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Nova Nota"><Icon name="FilePlus" size={18}/></button>
                <button onClick={() => onAdd('htmlView', null)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Nova Visualização HTML"><Icon name="Code" size={18}/></button>
                <button onClick={() => onAdd('folder', null)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Nova Pasta"><Icon name="FolderPlus" size={18}/></button>
            </div>
        );
    }
    if (viewType === 'videoteca') {
        return (
            <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                 <button onClick={() => onAdd('videoFolder', null)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Nova Pasta de Vídeo"><Icon name="FolderPlus" size={18}/></button>
            </div>
        );
    }
    return null;
  }

  return (
    <div className="w-full h-full text-gray-900 dark:text-gray-100 flex flex-col">
        {renderHeader()}
        <div className="overflow-y-auto flex-grow">
            {viewType === 'videoteca' && (
                <div 
                    onClick={() => onSelectItem(null)} 
                    className={`flex items-center p-1.5 rounded-md cursor-pointer group ${!selectedItem ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                     <div className="w-5 flex-shrink-0"></div>
                     <Icon name="Library" size={18} />
                     <span className="ml-2 text-sm font-semibold">Todos os Vídeos</span>
                </div>
            )}
            {tree.map(item => (
                <FileTreeItem 
                    key={item.id} 
                    item={item} 
                    level={0} 
                    onSelect={onSelectItem} 
                    selectedId={selectedItem?.id || null}
                    onAdd={onAdd}
                    onRename={onRename}
                    onDelete={onDelete}
                    viewType={viewType}
                />
            ))}
        </div>
    </div>
  );
};


// Custom hook to encapsulate mutation logic
const useItemMutations = (onItemsChange: () => void) => {
    const onAdd = async (type: ItemType, parentId: string | null) => {
        let defaultName = "Novo Item";
        if (type === 'note') defaultName = "Nova Nota";
        if (type === 'htmlView') defaultName = "Nova Visualização";
        if (type === 'folder') defaultName = "Nova Pasta";
        if (type === 'videoFolder') defaultName = "Nova Pasta de Vídeo";
        
        try {
            await createItem(defaultName, type, parentId);
            onItemsChange();
        } catch (error) {
            console.error("Failed to create item", error);
            alert("Erro: Não foi possível criar o item.");
        }
    };
    
    const onRename = async (id: string, newName: string) => {
        try {
            await updateItem(id, { name: newName });
            onItemsChange();
        } catch (error) {
            console.error("Failed to rename item", error);
            alert("Erro: Não foi possível renomear o item.");
        }
    };
    
    const onDelete = async (id: string) => {
        try {
            await deleteItem(id);
            onItemsChange();
        } catch (error) {
            console.error("Failed to delete item", error);
            alert("Erro: Não foi possível apagar o item.");
        }
    };

    return { onAdd, onRename, onDelete };
}
