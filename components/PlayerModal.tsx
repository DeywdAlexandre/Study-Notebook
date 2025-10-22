import React from 'react';
import type { Video } from '../types';
import Icon from './Icon';
import { getEmbedUrl } from '../utils/video';

interface PlayerModalProps {
  video: Video;
  onClose: () => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ video, onClose }) => {
  const embedUrl = getEmbedUrl(video.url);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
            {video.title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <Icon name="X" size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="flex-grow bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-red-500">
              <p>Não foi possível carregar este formato de vídeo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
