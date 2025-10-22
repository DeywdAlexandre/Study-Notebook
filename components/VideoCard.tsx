import React from 'react';
import type { Video } from '../types';
import Icon from './Icon';
import { getYoutubeThumbnail } from '../utils/video';

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onEdit, onDelete }) => {
  const thumbnailUrl = getYoutubeThumbnail(video.url);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group flex flex-col">
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="FileVideo" size={48} className="text-gray-400" />
          </div>
        )}
        <div 
            onClick={() => onPlay(video)}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Icon name="PlayCircle" size={56} className="text-white drop-shadow-lg" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate flex-grow mb-2" title={video.title}>
            {video.title}
        </h3>
        <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => onEdit(video)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Editar">
            <Icon name="Pencil" size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={() => onDelete(video)} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title="Apagar">
            <Icon name="Trash2" size={16} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
