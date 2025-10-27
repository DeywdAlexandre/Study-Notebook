

import React, { useState, useCallback } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';
import VideoModal from './VideoModal';
import VideoCard from './VideoCard';
import PlayerModal from './PlayerModal';
import { createVideo, updateVideo, deleteVideo } from '../services/api';
import type { Video } from '../types';
import { useConfirmation } from '../context/ConfirmationContext';
import { useAuth } from '../hooks/useAuth';

interface VideotecaProps {
    videos: Video[];
    onDataChange: () => void;
    selectedFolderId: string | null;
}

const Videoteca: React.FC<VideotecaProps> = ({ videos, onDataChange, selectedFolderId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const { confirm } = useConfirmation();
  const { user } = useAuth();

  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsModalOpen(true);
  };

  const handleSaveVideo = async (title: string, url: string, description: string, id?: string) => {
    if (!user) {
        alert("Erro: Utilizador não autenticado.");
        return;
    }
    try {
      if (id) {
        await updateVideo(id, { title, url, description });
      } else {
        await createVideo(title, url, description, selectedFolderId, user.uid);
      }
      onDataChange();
      setIsModalOpen(false);
    } catch (err) {
      alert('Falha ao guardar o vídeo.');
      console.error(err);
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    const confirmed = await confirm({
        title: `Apagar "${video.title}"`,
        message: 'Tem a certeza que quer apagar este vídeo? Esta ação não pode ser desfeita.',
        confirmButtonText: 'Sim, Apagar'
    });
    if (confirmed) {
        try {
            await deleteVideo(video.id);
            onDataChange();
        } catch (err) {
            alert('Falha ao apagar o vídeo.');
            console.error(err);
        }
    }
  };

  const renderContent = () => {
    if (videos.length === 0) {
      return (
        <div className="text-center text-slate-500 dark:text-slate-400">
            <Icon name="VideoOff" size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <p>Nenhum vídeo encontrado.</p>
            <p className="text-sm">Adicione um vídeo a esta pasta ou selecione "Todos os Vídeos".</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {videos.map(video => (
          <VideoCard 
            key={video.id} 
            video={video}
            onPlay={setPlayingVideo}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteVideo}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col text-slate-800 dark:text-slate-200 p-4 sm:p-6 overflow-y-auto">
      <div className="w-full flex justify-end items-center mb-6 flex-shrink-0">
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Icon name="Plus" size={16} />
          Adicionar Vídeo
        </button>
      </div>
      <div className={`w-full flex-grow flex justify-center ${videos.length > 0 ? 'items-start' : 'items-center'}`}>
         {renderContent()}
      </div>

      {isModalOpen && (
        <VideoModal
          video={editingVideo}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveVideo}
        />
      )}

      {playingVideo && (
        <PlayerModal 
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
};

export default Videoteca;
