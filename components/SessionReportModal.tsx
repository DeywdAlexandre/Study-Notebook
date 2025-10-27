import React from 'react';
import Icon from './Icon';
import { SessionStats } from './SessionSidebar';

interface SessionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SessionStats;
}

const SessionReportModal: React.FC<SessionReportModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#1A2233] rounded-lg shadow-xl w-full max-w-md border border-slate-700"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '20px 20px',
        }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-100">
              Relatório da Sessão
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
              <Icon name="X" size={20} className="text-slate-400" />
            </button>
          </div>
          
          <div className="bg-[#2C3A4F] rounded-lg p-4 space-y-3 text-base">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total de Mãos:</span>
              <span className="font-bold text-white">{stats.played}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Acertos:</span>
              <span className="font-bold text-green-400">{stats.correct}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Erros:</span>
              <span className="font-bold text-red-400">{stats.errors}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Precisão:</span>
              <span className="font-bold text-yellow-400">{stats.accuracy}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Maior Sequência:</span>
              <span className="font-bold text-purple-400">{stats.longestStreak}</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionReportModal;
