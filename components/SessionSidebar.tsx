import React from 'react';
import Icon from './Icon';

interface HandHistoryCardProps {
  rank: string;
  suit: 's' | 'h' | 'd' | 'c';
}

const HandHistoryCard: React.FC<HandHistoryCardProps> = ({ rank, suit }) => {
    const getCardColors = () => {
        switch (suit) {
            case 'h': return 'bg-red-600';
            case 'd': return 'bg-blue-600';
            case 's': return 'bg-slate-800';
            case 'c': return 'bg-green-600';
        }
    };

    return (
        <div className={`w-7 h-7 ${getCardColors()} rounded flex items-center justify-center text-white font-bold text-sm`}>
            {rank}
        </div>
    );
};


export interface SessionHand {
  id: number;
  hand: string;
  position: string;
  isCorrect: boolean;
}

export interface SessionStats {
  played: number;
  correct: number;
  errors: number;
  accuracy: string;
  streak: number;
  longestStreak: number;
}

interface SessionSidebarProps {
  history: SessionHand[];
  stats: SessionStats;
  onEndSession: () => void;
  isActive: boolean;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({ history, stats, onEndSession, isActive }) => {
  if (!isActive) {
    return null;
  }
  
  const getRowColor = (isCorrect: boolean, isLast: boolean) => {
    if (isLast) return 'bg-blue-600';
    return isCorrect ? 'bg-green-700/80' : 'bg-red-800/80';
  };

  return (
    <div className="h-full w-full bg-[#1A2233] p-4 flex flex-col gap-4 text-slate-200 overflow-y-auto" style={{
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
      backgroundSize: '20px 20px',
    }}>
      {/* Session Hands */}
      <div className="bg-[#2C3A4F] rounded-lg p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Mãos da Sessão</h2>
          <button onClick={onEndSession} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold">
            <Icon name="X" size={16} />
            Encerrar
          </button>
        </div>
        <p className="text-sm text-slate-400">{stats.played} mãos jogadas</p>
        
        <div className="text-xs text-slate-400 grid grid-cols-[20px_1fr_1fr] gap-4 px-2 border-b border-slate-600 pb-1">
          <span>#</span>
          <span>Cartas</span>
          <span>Posição</span>
        </div>
        
        <div className="flex flex-col-reverse gap-2 max-h-64 overflow-y-auto pr-1">
          {history.map((hand, index) => {
            const handString = hand.hand;
            const rank1 = handString[0];
            const rank2 = handString[1];
            const type = handString.length === 3 ? handString[2] : null;

            let suit1: 's' | 'h' | 'd' | 'c';
            let suit2: 's' | 'h' | 'd' | 'c';

            if (type === 's') {
                suit1 = 'c'; // Arbitrariamente escolhe verde para mãos do mesmo naipe
                suit2 = 'c';
            } else { // Offsuit ou Par
                suit1 = 'h'; // Arbitrariamente escolhe vermelho
                suit2 = 'd'; // e azul para naipes diferentes
            }
            
            return (
              <div 
                key={hand.id} 
                className={`grid grid-cols-[20px_1fr_1fr] gap-4 items-center p-2 rounded-md font-semibold text-sm ${getRowColor(hand.isCorrect, index === 0)}`}
              >
                <span className="text-slate-300">{hand.id}</span>
                <div className="flex items-center gap-1">
                  <HandHistoryCard rank={rank1} suit={suit1} />
                  <HandHistoryCard rank={rank2} suit={suit2} />
                </div>
                <span>{hand.position}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Session Stats */}
      <div className="bg-[#2C3A4F] rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Sessão Atual</h2>
        <div className="space-y-3 text-base">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Mãos Jogadas:</span>
            <span className="font-bold">{stats.played}</span>
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
            <span className="text-slate-400">Sequência Atual:</span>
            <span className="font-bold text-purple-400">{stats.streak}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Maior Sequência:</span>
            <span className="font-bold text-purple-400">{stats.longestStreak}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSidebar;