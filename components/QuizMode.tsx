import React, { useState, useEffect, useCallback } from 'react';
import type { PokerRange, QuizScenario } from '../types';
import { generateRandomScenario } from '../utils/poker-logic';
import PokerTable from './PokerTable';
import Icon from './Icon';
import Spinner from './Spinner';

interface QuizModeProps {
  range: PokerRange;
  onHandPlayed: (result: { scenario: QuizScenario; isCorrect: boolean }) => void;
  sessionStats: { correct: number; total: number; accuracy: string };
}

const QuizMode: React.FC<QuizModeProps> = ({ range, onHandPlayed, sessionStats }) => {
  const [scenario, setScenario] = useState<QuizScenario | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [userAction, setUserAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const nextScenario = useCallback(() => {
    setIsLoading(true);
    setFeedback(null);
    setUserAction(null);
    setTimeout(() => {
        const newScenario = generateRandomScenario(range);
        setScenario(newScenario);
        setIsLoading(false);
    }, 300);
  }, [range]);

  useEffect(() => {
    nextScenario();
  }, [range.id, nextScenario]);

  const handleAction = (action: string) => {
    if (feedback || !scenario) return;

    setUserAction(action);
    const isCorrect = scenario.correctActions.some(correctAction => correctAction.label === action);
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    onHandPlayed({ scenario, isCorrect });
    
    setTimeout(() => {
        nextScenario();
    }, isCorrect ? 1000 : 2500);
  };

  const getButtonFeedbackClass = (action: string) => {
    if (!feedback || !scenario) return '';

    const isCorrectAction = scenario.correctActions.some(ca => ca.label === action);
    const isChosenAction = userAction === action;

    if (feedback === 'correct' && isChosenAction) {
      return 'ring-4 ring-green-400';
    }
    if (feedback === 'incorrect') {
      if (isChosenAction) return 'ring-4 ring-red-500';
      if (isCorrectAction) return 'ring-4 ring-green-400 animate-pulse';
    }
    return 'opacity-50';
  };
  
  const getActionStyle = (action: string) => {
    switch(action.toUpperCase()) {
        case 'RAISE':
            return 'bg-gradient-to-b from-orange-500 to-orange-700 text-white';
        case 'CALL':
            return 'bg-gradient-to-b from-green-500 to-green-700 text-white';
        case 'FOLD':
        default:
            return 'bg-gradient-to-b from-slate-700 to-slate-900 text-slate-300';
    }
  }

  if (!scenario && !isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8">
            <Icon name="AlertTriangle" size={56} className="mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Range Vazio ou Inválido</h2>
            <p className="mt-2">Este range não tem ações definidas. Volte ao editor para adicionar mãos ao range.</p>
        </div>
      );
  }

  return (
    <div 
        className="h-full w-full relative flex flex-col items-center justify-between p-4 bg-[#0a0e1a] overflow-hidden"
        style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '20px 20px',
        }}
    >
        <div className="w-full flex-grow flex items-center justify-center z-0">
            {isLoading && <Spinner />}
            {!isLoading && scenario && (
                 <PokerTable 
                    scenario={scenario}
                 />
            )}
        </div>
        
        {feedback && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200%] text-center z-20">
                <div className={`px-6 py-2 rounded-lg text-white font-bold text-2xl shadow-lg ${feedback === 'correct' ? 'bg-green-600/90' : 'bg-red-600/90'}`}>
                    {feedback === 'correct' ? 'Correto!' : 'Incorreto!'}
                </div>
            </div>
        )}

        {!isLoading && scenario && (
            <div className="flex-shrink-0 flex gap-4 z-10 pb-4">
                {['FOLD', 'CALL', 'RAISE'].map(action => (
                    <button
                        key={action}
                        onClick={() => handleAction(action.charAt(0).toUpperCase() + action.slice(1).toLowerCase())}
                        disabled={!!feedback}
                        className={`w-32 h-14 rounded-lg font-bold text-lg uppercase shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed
                            ${getActionStyle(action)}
                            ${getButtonFeedbackClass(action.charAt(0).toUpperCase() + action.slice(1).toLowerCase())}
                        `}
                    >
                        {action}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};

export default QuizMode;