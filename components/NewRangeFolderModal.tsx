import React, { useState } from 'react';
import Icon from './Icon';

interface NewRangeFolderModalProps {
  onClose: () => void;
  onSave: (name: string, rangeType: 'all_positions' | 'blind_vs_blind' | 'open_raise') => Promise<void>;
}

const NewRangeFolderModal: React.FC<NewRangeFolderModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('Nova Pasta de HRC');
  const [rangeType, setRangeType] = useState<'all_positions' | 'blind_vs_blind' | 'open_raise'>('all_positions');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, insira um nome para a pasta.');
      return;
    }
    setIsSaving(true);
    await onSave(name, rangeType);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Criar Nova Pasta de HRC
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              <Icon name="X" size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome da Pasta
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Situação
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-900/30 dark:has-[:checked]:border-indigo-600">
                  <input
                    type="radio"
                    name="rangeType"
                    value="all_positions"
                    checked={rangeType === 'all_positions'}
                    onChange={() => setRangeType('all_positions')}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="ml-3 text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Todas as Posições</p>
                      <p className="text-slate-500 dark:text-slate-400 font-normal">Abrange todas as posições do Herói e Vilão.</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-900/30 dark:has-[:checked]:border-indigo-600">
                  <input
                    type="radio"
                    name="rangeType"
                    value="blind_vs_blind"
                    checked={rangeType === 'blind_vs_blind'}
                    onChange={() => setRangeType('blind_vs_blind')}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                   <div className="ml-3 text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Situações de Blind vs Blind</p>
                      <p className="text-slate-500 dark:text-slate-400 font-normal">Focado especificamente em cenários SB vs BB.</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-900/30 dark:has-[:checked]:border-indigo-600">
                  <input
                    type="radio"
                    name="rangeType"
                    value="open_raise"
                    checked={rangeType === 'open_raise'}
                    onChange={() => setRangeType('open_raise')}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                   <div className="ml-3 text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Open Raise (RFI)</p>
                      <p className="text-slate-500 dark:text-slate-400 font-normal">Cenários de Raise First In, sem posição de vilão.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isSaving ? 'A criar...' : 'Criar Pasta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRangeFolderModal;