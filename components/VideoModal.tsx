import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import type { Video } from '../types';

interface VideoModalProps {
  onClose: () => void;
  onSave: (title: string, url: string, id?: string) => Promise<void>;
  video: Video | null;
}

const VideoModal: React.FC<VideoModalProps> = ({ onClose, onSave, video }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (video) {
        setTitle(video.title);
        setUrl(video.url);
    } else {
        setTitle('');
        setUrl('');
    }
  }, [video]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      alert('Por favor, preencha o título e o URL.');
      return;
    }
    setIsSaving(true);
    await onSave(title, url, video?.id);
    // Não fecha aqui, o pai fecha após o recarregamento de dados
    // setIsSaving(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {video ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <Icon name="X" size={20} className="text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título do Vídeo
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: React Hooks em 10 Minutos"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL (YouTube ou Google Drive)
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSaving ? 'A guardar...' : 'Guardar Vídeo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
