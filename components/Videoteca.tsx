import React, { useState, useCallback } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';
import VideoModal from './VideoModal';
import VideoCard from './VideoCard';
import PlayerModal from './PlayerModal';
import { createVideo, updateVideo, deleteVideo } from '../services/api';
import type { Video } from '../types';

interface VideotecaProps {
    videos: Video[];
    onDataChange: () => void;
    selectedFolderId: string | null;
}

const Videoteca: React.FC<VideotecaProps> = ({ videos, onDataChange, selectedFolderId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsModalOpen(true);
  };

  const handleSaveVideo = async (title: string, url: string, id?: string) => {
    try {
      if (id) {
        await updateVideo(id, { title, url });
      } else {
        await createVideo(title, url, selectedFolderId);
      }
      onDataChange();
      setIsModalOpen(false);
    } catch (err) {
      alert('Falha ao guardar o vídeo.');
      console.error(err);
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    if (window.confirm(`Tem a certeza que quer apagar "${video.title}"?`)) {
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
        <div className="text-center">
            <Icon name="VideoOff" size={48} className="mx-auto text-gray-400 mb-4" />
            <p>Nenhum vídeo encontrado.</p>
            <p className="text-sm text-gray-500">Adicione um vídeo a esta pasta ou selecione "Todos os Vídeos".</p>
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
    <div className="h-full w-full flex flex-col text-gray-800 dark:text-gray-200 p-4 overflow-y-auto">
      <div className="w-full flex justify-end items-center mb-6 flex-shrink-0">
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Icon name="Plus" size={16} />
          Adicionar Vídeo
        </button>
      </div>
      <div className="w-full flex-grow">
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
