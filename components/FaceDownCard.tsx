import React from 'react';

const FaceDownCard: React.FC = () => {
  return (
    <div className="w-[36px] h-[50px] bg-green-700 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-green-900/50 relative p-1 flex items-center justify-center">
        <div className="text-center text-white font-black text-[7px] leading-tight transform -rotate-45 opacity-70">
            POKER<br/>ACE
        </div>
    </div>
  );
};

export default FaceDownCard;