
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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden group flex flex-col">
      <div className="relative aspect-video bg-slate-200 dark:bg-slate-700">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="FileVideo" size={48} className="text-slate-400 dark:text-slate-500" />
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
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate mb-1" title={video.title}>
            {video.title}
        </h3>
        {video.description && (
            <p title={video.description} className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 flex-grow font-normal">
                {video.description}
            </p>
        )}
        <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => onEdit(video)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" title="Editar">
            <Icon name="Pencil" size={16} className="text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={() => onDelete(video)} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title="Apagar">
            <Icon name="Trash2" size={16} className="text-red-500" />
          </button>
        </div>
      </div>
       <style>{`
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default VideoCard;
