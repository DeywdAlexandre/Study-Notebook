

import React, { useState, useRef, useEffect } from 'react';
import type { Item, ItemType } from '../types';
import Icon from './Icon';
import { createItem, updateItem, deleteItem } from '../services/api';
import { useConfirmation } from '../context/ConfirmationContext';
import NewRangeFolderModal from './NewRangeFolderModal';

interface FileTreeItemProps {
  item: Item;
  level: number;
  onSelect: (item: Item) => void;
  selectedId: string | null;
  onAdd: (type: ItemType, parentId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  viewType: 'notebook' | 'videoteca' | 'ranges' | 'treino';
}

const ItemIcon: React.FC<{ type: ItemType; isOpen?: boolean }> = ({ type, isOpen }) => {
  if (type === 'folder' || type === 'videoFolder' || type === 'rangeFolder') {
    const color = type === 'rangeFolder' ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500';
    return <Icon name={isOpen ? 'FolderOpenDot' : 'FolderDot'} className={color} size={18} />;
  }
  if (type === 'note') {
    return <Icon name="FilePenLine" className="text-indigo-600 dark:text-indigo-400" size={18} />;
  }
  if (type === 'htmlView') {
    return <Icon name="CodeXml" className="text-teal-600 dark:text-teal-500" size={18} />;
  }
  if (type === 'pokerRange') {
    return <Icon name="Grid" className="text-cyan-600 dark:text-cyan-500" size={18} />;
  }
  return null;
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({ item, level, onSelect, selectedId, onAdd, onRename, onDelete, viewType }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { confirm } = useConfirmation();
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = item.id === selectedId;

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleToggle = () => {
    if (item.type === 'folder' || item.type === 'videoFolder' || item.type === 'rangeFolder') {
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

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const confirmed = await confirm({
        title: `Apagar "${item.name}"`,
        message: 'Tem a certeza que quer apagar este item? Todos os conteúdos e sub-pastas serão permanentemente apagados. Esta ação não pode ser desfeita.',
        confirmButtonText: 'Sim, Apagar'
    });
    if (confirmed) {
        onDelete(item.id);
    }
  };

  const handleAddClick = (e: React.MouseEvent, type: ItemType) => {
      e.stopPropagation();
      onAdd(type, item.id);
      setIsMenuOpen(false);
  };
  
  const MenuItem: React.FC<{ onClick: (e: React.MouseEvent) => void; icon: React.ComponentProps<typeof Icon>['name']; label: string; isDestructive?: boolean }> = ({ onClick, icon, label, isDestructive }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 rounded-md ${
        isDestructive
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
      }`}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );

  const renderFolderActions = () => {
    switch(viewType) {
        case 'notebook':
            return (
                <>
                    <MenuItem onClick={(e) => handleAddClick(e, 'note')} icon="FileText" label="Nova Nota" />
                    <MenuItem onClick={(e) => handleAddClick(e, 'htmlView')} icon="Code" label="Nova Visualização HTML" />
                    <MenuItem onClick={(e) => handleAddClick(e, 'folder')} icon="FolderPlus" label="Nova Pasta" />
                </>
            );
        case 'videoteca':
            return <MenuItem onClick={(e) => handleAddClick(e, 'videoFolder')} icon="FolderPlus" label="Nova Pasta de Vídeo" />;
        case 'ranges':
            return <MenuItem onClick={(e) => handleAddClick(e, 'rangeFolder')} icon="FolderPlus" label="Nova Pasta de HRC" />;
        case 'treino':
            return (
                <>
                    <MenuItem onClick={(e) => handleAddClick(e, 'pokerRange')} icon="Grid" label="Novo Range de Treino" />
                    <MenuItem onClick={(e) => handleAddClick(e, 'rangeFolder')} icon="FolderPlus" label="Nova Pasta de Range" />
                </>
            );
        default:
            return null;
    }
  };

  return (
    <div className="relative">
      <div
        onClick={handleSelect}
        className={`flex items-center py-2 px-1.5 rounded-md cursor-pointer group ${
          isSelected ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="w-5 flex-shrink-0">
         {(item.type === 'folder' || item.type === 'videoFolder' || item.type === 'rangeFolder') && <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={16} className="text-slate-500" />}
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
                    className="w-full text-base bg-transparent outline-none ring-1 ring-indigo-500 rounded px-1"
                />
            </form>
        ) : (
             <span className="ml-2 text-base font-medium text-slate-800 dark:text-slate-200 truncate flex-grow">{item.name}</span>
        )}
       
        <div className="ml-auto flex items-center pr-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }}
              className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              title="Mais opções"
            >
              <Icon name="Equal" size={16} />
            </button>
        </div>
        
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute right-4 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-20 p-1"
          >
            {(item.type === 'folder' || item.type === 'videoFolder' || item.type === 'rangeFolder') && (
                <>
                    {renderFolderActions()}
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                </>
            )}
            <MenuItem onClick={handleRenameClick} icon="Pencil" label="Renomear" />
            <MenuItem onClick={handleDelete} icon="Trash2" label="Apagar" isDestructive />
          </div>
        )}
      </div>
      {isOpen && (item.type === 'folder' || item.type === 'videoFolder' || item.type === 'rangeFolder') && item.children && (
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
  viewType: 'notebook' | 'videoteca' | 'ranges' | 'treino';
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ items, onSelectItem, selectedItem, onItemsChange, viewType }) => {
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [rangeModalParentId, setRangeModalParentId] = useState<string | null>(null);

  const { onAdd, onRename, onDelete } = useItemMutations(onItemsChange, {
    setIsRangeModalOpen,
    setRangeModalParentId,
  }, viewType);

  const handleCreateRangeFolder = async (name: string, rangeType: 'all_positions' | 'blind_vs_blind' | 'open_raise') => {
    try {
        await createItem(name, 'rangeFolder', rangeModalParentId, { rangeType });
        onItemsChange();
        setIsRangeModalOpen(false);
    } catch (error) {
        console.error("Failed to create range folder", error);
        alert("Erro: Não foi possível criar a pasta de range.");
    }
  };

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
    switch(viewType) {
        case 'notebook':
            return (
                <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                    <button onClick={() => onAdd('note', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Nota"><Icon name="FilePlus" size={18}/></button>
                    <button onClick={() => onAdd('htmlView', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Visualização HTML"><Icon name="Code" size={18}/></button>
                    <button onClick={() => onAdd('folder', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Pasta"><Icon name="FolderPlus" size={18}/></button>
                </div>
            );
        case 'videoteca':
            return (
                <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                     <button onClick={() => onAdd('videoFolder', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Pasta de Vídeo"><Icon name="FolderPlus" size={18}/></button>
                </div>
            );
        case 'ranges':
            return (
                <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                     <button onClick={() => onAdd('rangeFolder', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Pasta de HRC"><Icon name="FolderPlus" size={18}/></button>
                </div>
            );
        case 'treino':
            return (
                <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                     <button onClick={() => onAdd('pokerRange', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Novo Range de Treino"><Icon name="Grid" size={18}/></button>
                     <button onClick={() => onAdd('rangeFolder', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Pasta de Range"><Icon name="FolderPlus" size={18}/></button>
                </div>
            );
        default:
            return null;
    }
  }
  
  const AllContentButton: React.FC<{label: string; icon: React.ComponentProps<typeof Icon>['name']}> = ({ label, icon }) => (
    <div 
        onClick={() => onSelectItem(null)} 
        className={`flex items-center p-1.5 rounded-md cursor-pointer group ${!selectedItem ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
    >
         <div className="w-5 flex-shrink-0"></div>
         <Icon name={icon} size={18} />
         <span className="ml-2 text-base font-semibold">{label}</span>
    </div>
  )

  return (
    <div className="w-full h-full text-slate-900 dark:text-slate-100 flex flex-col">
        {renderHeader()}
        <div className="overflow-y-auto flex-grow">
            {viewType === 'videoteca' && <AllContentButton label="Todos os Vídeos" icon="Library" />}
            {viewType === 'ranges' && <AllContentButton label="Todos os HRC" icon="LayoutGrid" />}

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
        {isRangeModalOpen && (
            <NewRangeFolderModal
                onClose={() => setIsRangeModalOpen(false)}
                onSave={handleCreateRangeFolder}
            />
        )}
    </div>
  );
};


// Custom hook to encapsulate mutation logic
const useItemMutations = (
    onItemsChange: () => void,
    rangeModalActions: {
        setIsRangeModalOpen: (isOpen: boolean) => void;
        setRangeModalParentId: (id: string | null) => void;
    },
    viewType: FileTreeViewProps['viewType']
) => {
    const onAdd = async (type: ItemType, parentId: string | null) => {
        if (type === 'rangeFolder' && viewType === 'ranges') {
            rangeModalActions.setRangeModalParentId(parentId);
            rangeModalActions.setIsRangeModalOpen(true);
            return;
        }
        
        let defaultName = "Novo Item";
        if (type === 'note') defaultName = "Nova Nota";
        if (type === 'htmlView') defaultName = "Nova Visualização";
        if (type === 'folder') defaultName = "Nova Pasta";
        if (type === 'videoFolder') defaultName = "Nova Pasta de Vídeo";
        if (type === 'rangeFolder') defaultName = "Nova Pasta de Range";
        if (type === 'pokerRange') defaultName = "Novo Range";
        
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
    
    const onDelete = async (id:string) => {
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
