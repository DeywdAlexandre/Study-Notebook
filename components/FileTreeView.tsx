import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import type { Item, ItemType } from '../types';
import Icon from './Icon';
import { createItem, updateItem, deleteItem } from '../services/api';
import { useConfirmation } from '../context/ConfirmationContext';
import NewRangeFolderModal from './NewRangeFolderModal';
import { useAuth } from '../hooks/useAuth';
import {
  DndContext,
  useDroppable,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface FileTreeItemProps extends React.HTMLAttributes<HTMLDivElement> {
  item: Item;
  level: number;
  onSelect: (item: Item) => void;
  selectedId: string | null;
  onAdd: (type: ItemType, parentId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  viewType: 'notebook' | 'videoteca' | 'ranges' | 'treino';
  isOpen: boolean;
  onToggle: (id: string) => void;
  isOverlay?: boolean;
  isOver?: boolean;
  isDropTarget?: boolean;
}

const ItemIcon: React.FC<{ type: ItemType; isOpen?: boolean }> = ({ type, isOpen }) => {
  const isFolder = type === 'folder' || type === 'videoFolder' || type === 'rangeFolder';
  if (isFolder) {
    const color = type === 'rangeFolder' ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500';
    return <Icon name={isOpen ? 'FolderOpenDot' : 'FolderDot'} className={color} size={18} />;
  }
  if (type === 'note') {
    return <Icon name="FilePenLine" className="text-indigo-600 dark:text-indigo-400" size={18} />;
  }
  if (type === 'htmlView') {
    return <Icon name="CodeXml" className="text-teal-600 dark:text-teal-500" size={18} />;
  }
  if (type === 'googleDoc') {
    return <Icon name="FileText" className="text-sky-600 dark:text-sky-500" size={18} />;
  }
  if (type === 'pokerRange') {
    return <Icon name="Grid" className="text-cyan-600 dark:text-cyan-500" size={18} />;
  }
  return null;
};

const FileTreeItem = forwardRef<HTMLDivElement, FileTreeItemProps>(({ item, level, onSelect, selectedId, onAdd, onRename, onDelete, viewType, isOpen, onToggle, isOverlay, isOver, isDropTarget, ...props }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { confirm } = useConfirmation();
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = item.id === selectedId;
  const isFolder = item.type === 'folder' || item.type === 'videoFolder' || item.type === 'rangeFolder';

  // Close menu on outside click
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
    if (isFolder) {
      onToggle(item.id);
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
                    <MenuItem onClick={(e) => handleAddClick(e, 'note')} icon="FilePenLine" label="Nova Nota" />
                    <MenuItem onClick={(e) => handleAddClick(e, 'htmlView')} icon="Code" label="Nova Visualização HTML" />
                    <MenuItem onClick={(e) => handleAddClick(e, 'googleDoc')} icon="FileText" label="Novo Google Doc" />
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
  
  let containerClasses = `flex items-center py-2 px-1.5 rounded-md cursor-pointer group h-[44px] transition-colors duration-150 relative`;
  if (isOverlay) {
      containerClasses += ' bg-slate-200 dark:bg-slate-700 shadow-lg';
  } else if (isDropTarget) {
      containerClasses += ' bg-indigo-100 dark:bg-indigo-900/70 ring-2 ring-indigo-500';
  } else if (isSelected) {
      containerClasses += ' bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-semibold';
  } else {
      containerClasses += ' hover:bg-slate-100 dark:hover:bg-slate-700';
  }

  return (
    <div
      ref={ref}
      onClick={handleSelect}
      className={containerClasses}
      style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      {...props}
    >
      <div {...(props as any).listeners} className="flex items-center flex-grow min-w-0 cursor-grab">
        <div onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="w-5 flex-shrink-0 cursor-pointer">
        {isFolder && <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={16} className="text-slate-500" />}
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
      </div>
     
      <div className="ml-auto flex items-center pr-1">
          {!isOverlay && (
              <button 
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on button click
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }}
                className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                title="Mais opções"
              >
                <Icon name="Equal" size={16} />
              </button>
          )}
      </div>
      
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute right-4 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-20 p-1"
        >
          {isFolder && (
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
  );
});


const ROOT_DROP_ID = '__root_drop_zone__';

const RootDropZone: React.FC<{ isOver: boolean }> = ({ isOver }) => {
    const { setNodeRef } = useDroppable({ id: ROOT_DROP_ID });
    return (
        <div
            ref={setNodeRef}
            className={`flex-shrink-0 mt-2 p-2 text-sm text-center border-2 border-dashed rounded-lg transition-colors ${
                isOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200' : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
            }`}
        >
            <Icon name="Move" size={16} className="mx-auto mb-1" />
            Mover para a Raiz
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

const buildTree = (list: Item[], parentId: string | null = null): Item[] => {
  return list
    .filter(item => item.parentId === parentId)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map(item => ({
      ...item,
      children: buildTree(list, item.id)
    }));
};

const isAncestor = (itemId: string, potentialAncestorId: string, allItems: Map<string, Item>): boolean => {
    let current = allItems.get(itemId);
    while (current?.parentId) {
        if (current.parentId === potentialAncestorId) {
            return true;
        }
        current = allItems.get(current.parentId);
    }
    return false;
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({ items, onSelectItem, selectedItem, onItemsChange, viewType }) => {
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [rangeModalParentId, setRangeModalParentId] = useState<string | null>(null);
  const { user } = useAuth();
  const [openFolders, setOpenFolders] = useState(new Set<string>());
  const [hasInitializedFolders, setHasInitializedFolders] = useState(false);

  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const itemsById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

  useEffect(() => {
    if (items.length > 0 && !hasInitializedFolders) {
        const folderIds = items.filter(i => i.type.endsWith('Folder') || i.type === 'folder').map(i => i.id);
        setOpenFolders(new Set(folderIds));
        setHasInitializedFolders(true);
    }
    if (items.length === 0 && hasInitializedFolders) {
        setHasInitializedFolders(false);
        setOpenFolders(new Set());
    }
  }, [items, hasInitializedFolders]);
  
  const toggleFolder = useCallback((id: string) => {
    setOpenFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }, []);

  const { onAdd, onRename, onDelete } = useItemMutations(onItemsChange, {
    setIsRangeModalOpen,
    setRangeModalParentId,
  }, viewType, user?.uid);

  const handleCreateRangeFolder = async (name: string, rangeType: 'all_positions' | 'blind_vs_blind' | 'open_raise') => {
    if (!user) {
        alert("Erro: Utilizador não autenticado.");
        return;
    }
    try {
        await createItem(name, 'rangeFolder', rangeModalParentId, user.uid, { rangeType });
        onItemsChange();
        setIsRangeModalOpen(false);
    } catch (error) {
        console.error("Failed to create range folder", error);
        alert("Erro: Não foi possível criar a pasta de range.");
    }
  };

  const flattenedVisibleItems = useMemo(() => {
    const tree = buildTree(items, null);
    const result: { item: Item; level: number }[] = [];
    
    const flatten = (nodes: Item[], level: number) => {
        for (const node of nodes) {
            result.push({ item: node, level });
            const isFolder = node.type === 'folder' || node.type === 'videoFolder' || node.type === 'rangeFolder';
            if (isFolder && node.children && openFolders.has(node.id)) {
                flatten(node.children, level + 1);
            }
        }
    }
    flatten(tree, 0);
    return result;
  }, [items, openFolders]);
  
  const flattenedItemIds = useMemo(() => flattenedVisibleItems.map(i => i.item.id), [flattenedVisibleItems]);
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current?.item ?? null);
    setOverId(event.active.id.toString());
  };
  
  const handleDragOver = (event: DragOverEvent) => {
      setOverId(event.over ? String(event.over.id) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    setOverId(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedItem = itemsById.get(String(active.id));
    if (!draggedItem) return;

    // --- Reparenting Logic ---
    const dropIsFolder = over.id === ROOT_DROP_ID || itemsById.get(String(over.id))?.type.includes('Folder');
    if (dropIsFolder) {
        const newParentId = over.id === ROOT_DROP_ID ? null : String(over.id);
        if (draggedItem.parentId === newParentId) return; // No change if dropped in same parent folder

        if (draggedItem.type.includes('Folder') && newParentId) {
            if (isAncestor(newParentId, draggedItem.id, itemsById)) {
                alert("Não é possível mover uma pasta para dentro de uma das suas próprias subpastas.");
                return;
            }
        }

        const siblings = items.filter(i => i.parentId === newParentId);
        const maxOrder = Math.max(0, ...siblings.map(i => Number(i.order || 0)));
        const newOrder = (maxOrder + 1000).toString();

        try {
            await updateItem(draggedItem.id, { parentId: newParentId, order: newOrder });
            onItemsChange();
        } catch (error) {
            console.error("Failed to move item:", error);
            alert("Erro ao mover o item.");
        }
        return;
    }

    // --- Reordering Logic ---
    const oldIndex = flattenedItemIds.indexOf(String(active.id));
    const newIndex = flattenedItemIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    
    const overItem = itemsById.get(String(over.id));
    if (!overItem || draggedItem.parentId !== overItem.parentId) return;

    const siblings = items
        .filter(i => i.parentId === draggedItem.parentId)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    const oldSiblingIndex = siblings.findIndex(s => s.id === draggedItem.id);
    const newSiblingIndex = siblings.findIndex(s => s.id === overItem.id);

    const reorderedSiblings = arrayMove(siblings, oldSiblingIndex, newSiblingIndex);
    const finalIndex = reorderedSiblings.findIndex(s => s.id === draggedItem.id);
    
    const prevItem = reorderedSiblings[finalIndex - 1];
    const nextItem = reorderedSiblings[finalIndex + 1];

    const prevOrder = prevItem ? Number(prevItem.order || 0) : 0;
    const nextOrder = nextItem ? Number(nextItem.order || 0) : prevOrder + 2000;
    
    const newOrder = (prevOrder + nextOrder) / 2;

    try {
        await updateItem(draggedItem.id, { order: newOrder.toString() });
        onItemsChange();
    } catch (error) {
        console.error("Failed to reorder item:", error);
        alert("Erro ao reordenar o item.");
    }
  };

  const renderHeader = () => {
    switch(viewType) {
        case 'notebook':
            return (
                <div className="flex justify-end items-center mb-2 flex-shrink-0 -mr-1">
                    <button onClick={() => onAdd('note', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Nota"><Icon name="FilePlus" size={18}/></button>
                    <button onClick={() => onAdd('htmlView', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Nova Visualização HTML"><Icon name="Code" size={18}/></button>
                    <button onClick={() => onAdd('googleDoc', null)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Novo Google Doc"><Icon name="FileText" size={18}/></button>
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
        className={`flex items-center p-1.5 rounded-md cursor-pointer group h-[44px] ${!selectedItem ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
    >
         <div className="w-5 flex-shrink-0"></div>
         <Icon name={icon} size={18} />
         <span className="ml-2 text-base font-semibold">{label}</span>
    </div>
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="w-full h-full text-slate-900 dark:text-slate-100 flex flex-col">
            {renderHeader()}
            <div className="flex-grow flex flex-col min-h-0">
                {(viewType === 'videoteca' || viewType === 'ranges') && (
                    <div className="flex-shrink-0">
                        {viewType === 'videoteca' && <AllContentButton label="Todos os Vídeos" icon="Library" />}
                        {viewType === 'ranges' && <AllContentButton label="Todos os HRC" icon="LayoutGrid" />}
                    </div>
                )}
                <div className="flex-grow overflow-y-auto pr-1">
                    <SortableContext items={flattenedItemIds} strategy={verticalListSortingStrategy}>
                        {flattenedVisibleItems.map(({ item, level }) => {
                             const isFolder = item.type === 'folder' || item.type === 'videoFolder' || item.type === 'rangeFolder';
                             const isOver = overId === item.id;
                             return (
                                <SortableItem
                                    key={item.id}
                                    id={item.id}
                                    item={item}
                                    level={level}
                                    onSelect={onSelectItem}
                                    selectedId={selectedItem?.id || null}
                                    onAdd={onAdd}
                                    onRename={onRename}
                                    onDelete={onDelete}
                                    viewType={viewType}
                                    isOpen={openFolders.has(item.id)}
                                    onToggle={toggleFolder}
                                    isDropTarget={isOver && isFolder && activeItem?.id !== item.id}
                                />
                             )
                        })}
                    </SortableContext>
                </div>
                {activeItem && <RootDropZone isOver={overId === ROOT_DROP_ID} />}
            </div>
            {isRangeModalOpen && (
                <NewRangeFolderModal
                    onClose={() => setIsRangeModalOpen(false)}
                    onSave={handleCreateRangeFolder}
                />
            )}
        </div>
        <DragOverlay>
            {activeItem ? (
                <FileTreeItem
                    item={activeItem}
                    level={0}
                    onSelect={()=>{}}
                    selectedId={null}
                    onAdd={()=>{}}
                    onRename={()=>{}}
                    onDelete={()=>{}}
                    viewType={viewType}
                    isOpen={false}
                    onToggle={()=>{}}
                    isOverlay
                />
            ) : null}
        </DragOverlay>
    </DndContext>
  );
};

const SortableItem: React.FC<Omit<FileTreeItemProps, 'isOverlay' | 'isOver'> & {id: string}> = ({ id, item, ...props }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };
    
    if (isDragging) {
        return <div className="h-[44px] bg-slate-200 dark:bg-slate-700 rounded-md" style={{ marginLeft: `${props.level * 1.5 + 0.5}rem` }} />;
    }

    return (
        <FileTreeItem
            ref={setNodeRef}
            style={style}
            item={item}
            {...props}
            {...attributes}
            listeners={listeners}
        />
    );
};


// Custom hook to encapsulate mutation logic
const useItemMutations = (
    onItemsChange: () => void,
    rangeModalActions: {
        setIsRangeModalOpen: (isOpen: boolean) => void;
        setRangeModalParentId: (id: string | null) => void;
    },
    viewType: FileTreeViewProps['viewType'],
    userId?: string
) => {
    const onAdd = async (type: ItemType, parentId: string | null) => {
        if (!userId) {
            alert("Erro: Utilizador não autenticado.");
            return;
        }

        if (type === 'rangeFolder' && viewType === 'ranges') {
            rangeModalActions.setRangeModalParentId(parentId);
            rangeModalActions.setIsRangeModalOpen(true);
            return;
        }
        
        let defaultName = "Novo Item";
        if (type === 'note') defaultName = "Nova Nota";
        if (type === 'htmlView') defaultName = "Nova Visualização";
        if (type === 'googleDoc') defaultName = "Novo Google Doc";
        if (type === 'folder') defaultName = "Nova Pasta";
        if (type === 'videoFolder') defaultName = "Nova Pasta de Vídeo";
        if (type === 'rangeFolder') defaultName = "Nova Pasta de Range";
        if (type === 'pokerRange') defaultName = "Novo Range";
        
        try {
            await createItem(defaultName, type, parentId, userId);
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
        if (!userId) {
            alert("Erro: Utilizador não autenticado.");
            return;
        }
        try {
            await deleteItem(id, userId);
            onItemsChange();
        } catch (error) {
            console.error("Failed to delete item", error);
            alert("Erro: Não foi possível apagar o item.");
        }
    };

    return { onAdd, onRename, onDelete };
}