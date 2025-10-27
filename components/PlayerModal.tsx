
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
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex-grow min-w-0 pr-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {video.title}
            </h3>
            {video.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-h-16 overflow-y-auto font-normal">
                    {video.description}
                </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0">
            <Icon name="X" size={24} className="text-slate-600 dark:text-slate-300" />
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
