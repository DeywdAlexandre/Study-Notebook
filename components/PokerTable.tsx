import React from 'react';
import type { QuizScenario, StackDepth, PokerPosition } from '../types';
import PlayingCard from './PlayingCard';
import FaceDownCard from './FaceDownCard';
import Icon from './Icon';

interface MockPlayer {
  id: string;
  name: string;
  stack: number;
  position: string;
  isHero?: boolean;
}

const PlayerSeat: React.FC<{
    player: MockPlayer;
    isHero: boolean;
    cards: React.ReactNode;
    isDealer: boolean;
    stackDepthInBB: StackDepth;
}> = ({ player, isHero, cards, isDealer, stackDepthInBB }) => {
    const heroClass = isHero ? 'bg-yellow-400/90 border-yellow-300 text-black' : 'bg-slate-800/80 border-slate-700 text-white';

    return (
        <div className="relative flex flex-col items-center gap-1">
            {isDealer && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 z-10 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm border-2 border-slate-300 shadow-md">D</div>
            )}
            <div className="flex gap-1 h-[85px] items-end">
                {cards}
            </div>
            <div className={`relative flex flex-col items-center justify-center w-[110px] p-2 rounded-lg border-2 shadow-lg ${heroClass}`}>
                <span className="text-sm font-bold truncate w-full text-center">{player.position}</span>
                <span className="text-xs opacity-80">{stackDepthInBB}bb</span>
            </div>
        </div>
    );
}

const PokerTable: React.FC<{ scenario: QuizScenario }> = ({ scenario }) => {
    const heroSuits = React.useMemo(() => {
        const suits: ('s' | 'h' | 'd' | 'c')[] = ['s', 'h', 'd', 'c'];
        const handStr = scenario.hand;
        let s1: 's' | 'h' | 'd' | 'c';
        let s2: 's' | 'h' | 'd' | 'c';

        // Shuffle suits array to get random suits
        const shuffledSuits = suits.sort(() => 0.5 - Math.random());

        if (handStr.length === 3 && handStr.endsWith('s')) { // Suited hand
            s1 = shuffledSuits[0];
            s2 = s1;
        } else { // Pair or offsuit hand
            s1 = shuffledSuits[0];
            s2 = shuffledSuits[1];
        }
        return [s1, s2];
    }, [scenario.hand]);

    // Coordenadas ajustadas para uma distribuição oval mais natural
    const seatPositions = [
        // 0: Bottom Center (Hero)
        { top: '104%', left: '50%', transform: 'translate(-50%, -50%)' },
        // 1: Bottom Left
        { top: '85%', left: '18%', transform: 'translate(-50%, -50%)' },
        // 2: Left Center
        { top: '50%', left: '-4%', transform: 'translate(-50%, -50%)' },
        // 3: Top Left
        { top: '15%', left: '18%', transform: 'translate(-50%, -50%)' },
        // 4: Top Center
        { top: '-4%', left: '50%', transform: 'translate(-50%, -50%)' },
        // 5: Top Right
        { top: '15%', left: '82%', transform: 'translate(-50%, -50%)' },
        // 6: Right Center
        { top: '50%', left: '104%', transform: 'translate(-50%, -50%)' },
        // 7: Bottom Right
        { top: '85%', left: '82%', transform: 'translate(-50%, -50%)' },
    ];
    
    const heroCards = (
        <>
            <PlayingCard rank={scenario.hand[0]} suit={heroSuits[0]} />
            <PlayingCard rank={scenario.hand[1]} suit={heroSuits[1]} />
        </>
    );

    const villainCards = (
        <>
            <FaceDownCard />
            <FaceDownCard />
        </>
    );
    
    const actionOrder: PokerPosition[] = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const heroActionIndex = actionOrder.indexOf(scenario.heroPosition);

    const playersOnTable: MockPlayer[] = [];
    for (let i = 0; i < 8; i++) { // i é o índice do assento visual, no sentido horário a partir do herói
        // A posição lógica do jogador é calculada com base na posição do herói
        const logicalPositionIndex = (heroActionIndex + i) % 8;
        const position = actionOrder[logicalPositionIndex];
        const isHero = i === 0;

        playersOnTable.push({
            id: isHero ? 'hero' : `p${i}`,
            name: isHero ? 'Hero' : `Player ${i}`,
            stack: 5000,
            position: position,
            isHero: isHero,
        });
    }

    const sbSeatIndex = playersOnTable.findIndex(p => p.position === 'SB');
    const bbSeatIndex = playersOnTable.findIndex(p => p.position === 'BB');

    const chipPositions = [
        { top: '85%', left: '50%', transform: 'translate(-50%, -50%)' }, // 0: In front of Hero
        { top: '75%', left: '28%', transform: 'translate(-50%, -50%)' }, // 1: In front of Bottom Left
        { top: '50%', left: '15%', transform: 'translate(-50%, -50%)' }, // 2: In front of Left Center
        { top: '25%', left: '28%', transform: 'translate(-50%, -50%)' }, // 3: In front of Top Left
        { top: '15%', left: '50%', transform: 'translate(-50%, -50%)' }, // 4: In front of Top Center
        { top: '25%', left: '72%', transform: 'translate(-50%, -50%)' }, // 5: In front of Top Right
        { top: '50%', left: '85%', transform: 'translate(-50%, -50%)' }, // 6: In front of Right Center
        { top: '75%', left: '72%', transform: 'translate(-50%, -50%)' }, // 7: In front of Bottom Right
    ];

    const sbChipPosition = sbSeatIndex !== -1 ? chipPositions[sbSeatIndex] : null;
    const bbChipPosition = bbSeatIndex !== -1 ? chipPositions[bbSeatIndex] : null;
    
    return (
        <div className="relative w-[95vw] max-w-[1000px] aspect-[1.6/1]">
            {/* Outer border */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-green-400 rounded-[50%] p-2">
                 {/* Racetrack */}
                <div className="w-full h-full bg-[#282828] rounded-[50%] p-6">
                    {/* Felt */}
                    <div className="w-full h-full bg-[#0d3b29] rounded-[50%] relative border-2 border-green-900/50">
                        {/* Center elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                            <div className="flex gap-2 opacity-30 text-[#0a291d]">
                                <Icon name="Spade" size={24}/>
                                <Icon name="Heart" size={24}/>
                                <Icon name="Diamond" size={24}/>
                                <Icon name="Club" size={24}/>
                            </div>
                            <div className="text-center">
                                <span className="text-white/50 text-sm">Pote: 1.5 BB</span>
                                <h2 className="text-white/30 font-bold text-2xl tracking-widest">ACE</h2>
                            </div>
                        </div>

                        {/* Blinds */}
                        {sbChipPosition && (
                            <div className="absolute flex items-center gap-1 bg-black/50 p-1 rounded-full text-xs text-yellow-300" style={sbChipPosition}>
                                <Icon name="Coins" size={14}/> 0.5 BB
                            </div>
                        )}
                        {bbChipPosition && (
                            <div className="absolute flex items-center gap-1 bg-black/50 p-1 rounded-full text-xs text-yellow-300" style={bbChipPosition}>
                                <Icon name="Coins" size={14}/> 1 BB
                            </div>
                        )}


                        {/* Player Seats */}
                        {playersOnTable.map((player, index) => {
                            const playerActionIndex = actionOrder.indexOf(player.position as PokerPosition);
                            // Cenário RFI: todos antes do herói desistiram. Mostra cartas apenas para jogadores que ainda vão agir.
                            const isYetToAct = playerActionIndex > heroActionIndex;

                            return (
                                <div key={player.id} className="absolute" style={seatPositions[index]}>
                                    <PlayerSeat 
                                        player={player}
                                        isHero={!!player.isHero}
                                        cards={player.isHero ? heroCards : (isYetToAct ? villainCards : <div className="w-[76px] h-[50px]" />)}
                                        isDealer={player.position === 'BTN'}
                                        stackDepthInBB={scenario.stackDepth}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PokerTable;