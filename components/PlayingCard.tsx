import React from 'react';

interface PlayingCardProps {
  rank: string;
  suit: 's' | 'h' | 'd' | 'c';
}

const PlayingCard: React.FC<PlayingCardProps> = ({ rank, suit }) => {
  const getSuitSymbol = () => {
    switch (suit) {
      case 'h': return '♥';
      case 'd': return '♦';
      case 's': return '♠';
      case 'c': return '♣';
    }
  };

  const getCardColors = () => {
    switch (suit) {
      case 'h': return 'bg-red-600 border-red-800';
      case 'd': return 'bg-blue-600 border-blue-800'; // Blue for diamonds
      case 's': return 'bg-slate-800 border-slate-900'; // Black for spades
      case 'c': return 'bg-green-600 border-green-800'; // Green for clubs
    }
  };

  const symbol = getSuitSymbol();
  const cardColors = getCardColors();
  const textColor = 'text-white';

  return (
    <div className={`w-[60px] h-[85px] ${cardColors} rounded-md shadow-lg relative p-1 border-2`}>
      <div className={`absolute top-1 left-1.5 text-center font-bold ${textColor}`}>
        <span className="block leading-none text-2xl" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{rank}</span>
      </div>
       <div className={`absolute bottom-1 right-1.5 text-center font-bold ${textColor} transform rotate-180`}>
        <span className="block leading-none text-2xl" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{rank}</span>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-4xl ${textColor}`}>
         <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{symbol}</span>
      </div>
    </div>
  );
};

export default PlayingCard;