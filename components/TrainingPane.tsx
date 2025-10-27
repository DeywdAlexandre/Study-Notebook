import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { PokerRange, RangeMatrix, Item, RangeCell, PokerPosition, StackDepth, RangeActions } from '../types';
import { getRange, updateRange } from '../services/api';
import { parseRangeText, HAND_ORDER, getMaxCombos, generateSpecificCombos } from '../utils/range-parser';
import Icon from './Icon';
import Spinner from './Spinner';

const POSITIONS_LIST: PokerPosition[] = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const STACK_DEPTHS: StackDepth[] = ['80', '60', '50', '40', '35', '30', '25', '20', '17', '14', '12'];


// Helper to format combo counts: show whole numbers without decimals, otherwise show 2 decimal places.
const formatComboCount = (count: number): string => {
    // If count is very close to a whole number, show as integer.
    if (Math.abs(count - Math.round(count)) < 0.01) {
        return Math.round(count).toString();
    }
    // Otherwise, show with precision for mixed strategies.
    return count.toFixed(2);
};

// Sub-componente: Grade de Ranges
const RangeGrid: React.FC<{
    matrix: RangeMatrix;
    onHandSelect: (hand: string) => void;
    selectedHand: string | null;
}> = ({ matrix, onHandSelect, selectedHand }) => {

    const renderCell = (hand: string) => {
        const cells = matrix[hand] || [];
        const totalWeight = cells.reduce((acc, cell) => acc + cell.weight, 0);
        
        const FOLD_COLOR = 'transparent';

        const gradientParts = cells.map((cell, index) => {
            const start = cells.slice(0, index).reduce((acc, c) => acc + c.weight, 0);
            const end = start + cell.weight;
            return `${cell.color} ${start}% ${end}%`;
        });
        
        if (totalWeight < 100) {
            gradientParts.push(`${FOLD_COLOR} ${totalWeight}% 100%`);
        }

        const background = totalWeight > 0.01 ? `linear-gradient(to right, ${gradientParts.join(', ')})` : FOLD_COLOR;
        const textShadow = totalWeight > 50 ? 'text-shadow: 0 1px 2px rgba(0,0,0,0.7)' : '';
        const isSelected = hand === selectedHand;

        return (
            <div 
                className={`grid-cell ${isSelected ? 'selected' : ''}`}
                title={hand}
                onClick={() => onHandSelect(hand)}
                style={{ background }}
            >
                <div className={`cell-content`} style={{ textShadow }}>
                    <span className="hand-name">{hand}</span>
                </div>
                 {totalWeight > 0.01 && (
                    <div className="combo-count">
                        {`${Math.round(totalWeight)}%`}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="range-grid">
            {HAND_ORDER.map((rowCard) =>
                HAND_ORDER.map((colCard, j) => {
                    const i = HAND_ORDER.indexOf(rowCard);
                    const finalHand = i > j ? `${HAND_ORDER[j]}${rowCard}o` : (i < j ? `${rowCard}${HAND_ORDER[j]}s` : `${rowCard}${HAND_ORDER[j]}`);
                    return renderCell(finalHand);
                })
            )}
        </div>
    );
};

// Sub-componente: Sumário de Ações
const ActionSummary: React.FC<{ matrix: RangeMatrix; }> = ({ matrix }) => {
    const summary = useMemo(() => {
        const actionMap = new Map<string, { color: string, comboCount: number }>();
        let totalPlayedCombos = 0;

        for (const hand in matrix) {
            const actions = matrix[hand];
            const maxCombos = getMaxCombos(hand);
            for (const action of actions) {
                const combos = (action.weight / 100) * maxCombos;
                totalPlayedCombos += combos;

                let current = actionMap.get(action.actionName);
                if (!current) {
                    // Initialize with the color from the first time we see this action
                    current = { color: action.color, comboCount: 0 };
                }

                actionMap.set(action.actionName, {
                    ...current,
                    comboCount: current.comboCount + combos,
                });
            }
        }

        const totalCombos = 1326;
        const foldCombos = Math.max(0, totalCombos - totalPlayedCombos);

        // Add Fold action if there are any folded hands
        if (foldCombos > 0.01) {
            actionMap.set('Fold', { color: '#4b5563', comboCount: foldCombos });
        }
        
        const sortedActions = Array.from(actionMap.entries()).sort((a, b) => b[1].comboCount - a[1].comboCount);
        
        return {
            actions: sortedActions.map(([name, data]) => ({
                name,
                ...data,
                percentage: totalCombos > 0 ? (data.comboCount / totalCombos) * 100 : 0,
            })),
        };
    }, [matrix]);

    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h3 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">Sumário de Ações</h3>
            <div className="flex flex-wrap gap-2">
                {summary.actions.map((action) => (
                    <div
                        key={action.name}
                        className="relative flex-1 flex flex-col justify-between p-2 text-white overflow-hidden rounded-md"
                        style={{
                            backgroundColor: action.color,
                            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                            minWidth: '70px',
                        }}
                        title={`${action.name}: ${action.percentage.toFixed(2)}% (${formatComboCount(action.comboCount)} combos)`}
                    >
                        <div className="font-bold text-sm truncate">{action.name}</div>
                        <div className="flex justify-between items-end mt-1">
                            <div className="text-xl font-bold">
                                {action.percentage.toFixed(1)}%
                            </div>
                            <div className="text-right text-xs">
                                <span className="block font-semibold">{formatComboCount(action.comboCount)}</span>
                                <span className="opacity-80">combos</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Sub-componente para mostrar um combo de mão com naipes coloridos (ex: AsKc)
const ComboVisual: React.FC<{ comboName: string }> = ({ comboName }) => {
    if (comboName.length !== 4) {
        // Fallback para formatos inesperados
        return <span className="text-white text-xl font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{comboName}</span>;
    }

    const r1 = comboName[0];
    const s1 = comboName[1];
    const r2 = comboName[2];
    const s2 = comboName[3];
    
    // Componente interno para mostrar o naipe com a cor correta
    const SuitDisplay: React.FC<{ suit: string }> = ({ suit }) => {
        switch (suit) {
            case 's': return <span style={{ color: '#e2e8f0' }}>♠</span>; // slate-200 (quase branco para contraste)
            case 'h': return <span style={{ color: '#f87171' }}>♥</span>; // red-400
            case 'd': return <span style={{ color: '#60a5fa' }}>♦</span>; // blue-400
            case 'c': return <span style={{ color: '#4ade80' }}>♣</span>; // green-400
            default: return null;
        }
    };

    return (
        <div className="flex items-baseline justify-center text-white text-xl font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            <span>{r1}</span>
            <SuitDisplay suit={s1} />
            <span>{r2}</span>
            <SuitDisplay suit={s2} />
        </div>
    );
};


// Sub-componente: Detalhes da Mão
const HandDetail: React.FC<{ matrix: RangeMatrix, selectedHand: string | null }> = ({ matrix, selectedHand }) => {
    const details = useMemo(() => {
        if (!selectedHand) return null;
        
        const actions = matrix[selectedHand] || [];
        const maxCombos = getMaxCombos(selectedHand);
        const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
        const foldWeight = 100 - totalWeight;

        const allActions = [...actions];
        if (foldWeight > 0.01) {
            allActions.push({ actionName: 'Fold', color: '#4b5563', weight: foldWeight });
        }
        
        // --- Logic to create visual combo representation ---
        const specificCombos = generateSpecificCombos(selectedHand);
        const comboVisuals: { comboName: string; background: string; title: string; }[] = [];

        // Create the gradient from the actions. Sorting by weight makes the largest frequency appear first.
        const sortedActionsForGradient = allActions.sort((a, b) => b.weight - a.weight);
        let accumulatedPercentage = 0;
        const gradientParts = sortedActionsForGradient.map(action => {
            const start = accumulatedPercentage;
            accumulatedPercentage += action.weight;
            const end = Math.min(accumulatedPercentage, 100);
            return `${action.color} ${start}% ${end}%`;
        });

        // Create the background style string.
        const background = gradientParts.length > 1
            ? `linear-gradient(to right, ${gradientParts.join(', ')})`
            : (allActions.length === 1 ? allActions[0].color : 'transparent');

        // Create the title string for the tooltip.
        const titleText = sortedActionsForGradient.map(a => `${a.actionName}: ${a.weight.toFixed(1)}%`).join(' | ');

        // Generate the visual for each specific combo.
        if (specificCombos.length > 0) {
            for (const comboName of specificCombos) {
                comboVisuals.push({
                    comboName: comboName,
                    background: background,
                    title: `${comboName} - ${titleText}`
                });
            }
        } else {
            // Fallback if specific combos aren't generated
            for (let i = 0; i < maxCombos; i++) {
                comboVisuals.push({
                    comboName: `${selectedHand}-c${i+1}`,
                    background: background,
                    title: `${selectedHand} - ${titleText}`
                });
            }
        }
        
        // Sort actions for display list by weight
        const sortedActionsForList = allActions.sort((a,b) => b.weight - a.weight);

        return {
            hand: selectedHand,
            actions: sortedActionsForList.map(a => ({
                ...a,
                combos: (a.weight / 100) * maxCombos
            })),
            comboVisuals
        };
    }, [matrix, selectedHand]);

    if (!details) {
        return (
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex-grow flex items-center justify-center">
                <p className="text-sm text-slate-500">Selecione uma mão na grade para ver os detalhes.</p>
            </div>
        );
    }
    
    // Determine grid layout based on combo count for optimal layout
    let gridLayoutClass = '';
    const comboCount = details.comboVisuals.length;
    if (comboCount === 4) { // Suited
        gridLayoutClass = 'grid-cols-2'; // 2x2 grid
    } else if (comboCount === 6) { // Pairs
        gridLayoutClass = 'grid-cols-3'; // 2x3 grid
    } else if (comboCount === 12) { // Offsuit
        gridLayoutClass = 'grid-cols-4'; // 3x4 grid
    }

    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex-grow flex flex-col">
            <h3 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">Frequências para <span className="text-indigo-500">{details.hand}</span></h3>
            
            <div className="flex flex-wrap gap-2">
                {details.actions.map(action => (
                    <div
                        key={action.actionName}
                        className="relative flex-1 flex flex-col justify-between p-2 text-white overflow-hidden rounded-md"
                        style={{
                            backgroundColor: action.color,
                            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                            minWidth: '70px',
                        }}
                        title={`${action.actionName}: ${action.weight.toFixed(1)}% (${formatComboCount(action.combos)} combos)`}
                    >
                        <div className="font-bold text-sm truncate">{action.actionName}</div>
                        <div className="flex justify-between items-end mt-1">
                            <div className="text-xl font-bold">
                                {action.weight.toFixed(1)}%
                            </div>
                            <div className="text-right text-xs">
                                <span className="block font-semibold">{formatComboCount(action.combos)}</span>
                                <span className="opacity-80">combos</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {details.comboVisuals.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Representação Visual dos Combos</h4>
                    <div className={`grid ${gridLayoutClass} gap-1.5`}>
                        {details.comboVisuals.map((combo, index) => (
                            <div
                                key={index}
                                className="w-full aspect-square rounded flex items-center justify-center"
                                style={{ background: combo.background }}
                                title={combo.title}
                            >
                               <ComboVisual comboName={combo.comboName} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface TrainingPaneProps {
    selectedItem: Item | null;
    onDataChange: () => void;
}

const TrainingPane: React.FC<TrainingPaneProps> = ({ selectedItem, onDataChange }) => {
    const [currentRange, setCurrentRange] = useState<PokerRange | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStack, setSelectedStack] = useState<StackDepth>('40');
    const [selectedPosition, setSelectedPosition] = useState<PokerPosition>('UTG');
    const [editedRawText, setEditedRawText] = useState<RangeActions>({});
    const [matrix, setMatrix] = useState<RangeMatrix>({});
    const [selectedHand, setSelectedHand] = useState<string | null>(null);
    
    const normalizedMatrix = useMemo(() => {
        const newMatrix: RangeMatrix = {};
        for (const hand in matrix) {
            const actions = matrix[hand];
            const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);

            if (totalWeight > 100.01) { 
                const factor = 100 / totalWeight;
                newMatrix[hand] = actions.map(action => ({
                    ...action,
                    weight: action.weight * factor,
                }));
            } else {
                newMatrix[hand] = actions;
            }
        }
        return newMatrix;
    }, [matrix]);

    useEffect(() => {
        if (selectedItem?.type === 'pokerRange' && selectedItem.contentId) {
            setIsLoading(true);
            setCurrentRange(null);
            getRange(selectedItem.contentId)
                .then(rangeData => {
                    setCurrentRange(rangeData);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setCurrentRange(null);
        }
        setSelectedHand(null);
        setSelectedStack('40');
        setSelectedPosition('UTG');
    }, [selectedItem]);

    useEffect(() => {
        if (currentRange) {
            const positionData = currentRange.rangesByStack?.[selectedStack]?.[selectedPosition];
            const rawTextData = (typeof positionData?.rawText === 'string')
                ? { raise: positionData.rawText }
                : (positionData?.rawText || {});
            setEditedRawText(rawTextData as RangeActions);
        } else {
            setEditedRawText({});
        }
        setSelectedHand(null);
    }, [currentRange, selectedStack, selectedPosition]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            // FIX: Use a type guard (`typeof text === 'string'`) to ensure `text` is a string before calling .trim(). This resolves a TypeScript error where the type was inferred as 'unknown'.
            if (Object.values(editedRawText).some(text => typeof text === 'string' && text.trim() !== '')) {
                setMatrix(parseRangeText(editedRawText));
            } else {
                setMatrix({});
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [editedRawText]);

    const handleSave = async () => {
        if (!currentRange) return;
        const finalMatrix = parseRangeText(editedRawText);

        const newRangesByStack = JSON.parse(JSON.stringify(currentRange.rangesByStack || {}));

        if (!newRangesByStack[selectedStack]) {
            newRangesByStack[selectedStack] = {};
        }
        
        const newPositionData = {
            rawText: editedRawText,
            matrix: finalMatrix
        };

        // FIX: Use a type guard (`typeof val === 'string'`) to ensure `val` is a string before calling .trim(). This resolves a TypeScript error where the type was inferred as 'unknown'.
        if (Object.values(editedRawText).every(val => typeof val !== 'string' || val.trim() === '')) {
            delete newRangesByStack[selectedStack][selectedPosition];
            if (Object.keys(newRangesByStack[selectedStack]).length === 0) {
                delete newRangesByStack[selectedStack];
            }
        } else {
             newRangesByStack[selectedStack][selectedPosition] = newPositionData;
        }

        await updateRange(currentRange.id, { rangesByStack: newRangesByStack });
        
        setCurrentRange(prev => prev ? { ...prev, rangesByStack: newRangesByStack } : null);
        
        onDataChange();
    };

    const handleTextChange = (action: keyof RangeActions, value: string) => {
        setEditedRawText(prev => ({ ...prev, [action]: value }));
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center"><Spinner /></div>;
    }

    if (!selectedItem || selectedItem.type !== 'pokerRange') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-4">
                <Icon name="Grid" size={56} className="mb-4 text-slate-400 dark:text-slate-500" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Editor de Ranges</h2>
                <p className="mt-2">Selecione um range na barra lateral para começar.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-4 gap-4 overflow-hidden">
             <div className="flex-shrink-0 flex flex-wrap gap-1 sm:gap-2 p-1 sm:p-2 bg-slate-100 dark:bg-slate-800 rounded-lg justify-center items-center">
                {/* Stack Depth Selector */}
                <div className="flex flex-wrap gap-1">
                    {STACK_DEPTHS.map(stack => (
                        <button
                            key={stack}
                            onClick={() => setSelectedStack(stack)}
                            className={`px-2 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                                selectedStack === stack
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-slate-600'
                            }`}
                        >
                            {stack}
                        </button>
                    ))}
                </div>
                
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden sm:block"></div>

                {/* Position Selector */}
                <div className="flex flex-wrap gap-1">
                    {POSITIONS_LIST.map(pos => (
                        <button
                            key={pos}
                            onClick={() => setSelectedPosition(pos)}
                            className={`px-2 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                                selectedPosition === pos
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-slate-600'
                            }`}
                        >
                            {pos}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <div className="flex-grow min-h-0">
                        <RangeGrid matrix={normalizedMatrix} onHandSelect={setSelectedHand} selectedHand={selectedHand} />
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2">
                   <ActionSummary matrix={normalizedMatrix} />
                   <HandDetail matrix={normalizedMatrix} selectedHand={selectedHand} />
                    <div className="flex-shrink-0 flex flex-col gap-2">
                        <div>
                            <label className="text-sm font-bold text-orange-500">Raise Range</label>
                            <textarea
                                value={editedRawText.raise || ''}
                                onChange={(e) => handleTextChange('raise', e.target.value)}
                                placeholder={`Cole o range de Raise aqui...`}
                                className="w-full h-16 bg-white dark:bg-slate-800 font-mono p-2 text-xs resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-green-500">Call Range</label>
                            <textarea
                                value={editedRawText.call || ''}
                                onChange={(e) => handleTextChange('call', e.target.value)}
                                placeholder={`Cole o range de Call aqui...`}
                                className="w-full h-16 bg-white dark:bg-slate-800 font-mono p-2 text-xs resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 border border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-purple-500">All-in Range</label>
                            <textarea
                                value={editedRawText.allin || ''}
                                onChange={(e) => handleTextChange('allin', e.target.value)}
                                placeholder={`Cole o range de All-in aqui...`}
                                className="w-full h-16 bg-white dark:bg-slate-800 font-mono p-2 text-xs resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <div className="flex justify-end mt-2">
                             <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 flex items-center gap-2">
                                <Icon name="Save" size={14}/> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .range-grid {
                    display: grid;
                    grid-template-columns: repeat(13, 1fr);
                    grid-gap: 1px;
                    width: 100%;
                    max-width: 700px;
                    margin: 0 auto;
                    aspect-ratio: 1 / 1;
                    background-color: #e2e8f0; /* slate-200 */
                    border: 1px solid #e2e8f0; /* slate-200 */
                    border-radius: 8px;
                    overflow: hidden;
                }
                .dark .range-grid {
                    grid-gap: 0;
                    background-color: transparent;
                    border: 2px dashed rgba(255, 255, 255, 0.3);
                }
                .grid-cell {
                    position: relative;
                    background-color: #ffffff; /* white */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                    cursor: pointer;
                    transition: transform 0.1s ease-out;
                    color: #1e293b; /* slate-800 */
                }
                .dark .grid-cell {
                    background-color: transparent;
                    color: #e2e8f0; /* slate-200 */
                    border-right: 1px dashed rgba(255, 255, 255, 0.2);
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
                }
                .dark .grid-cell:nth-child(13n) {
                    border-right: 0;
                }
                .dark .grid-cell:nth-child(n+157) {
                    border-bottom: 0;
                }
                .grid-cell:hover {
                    transform: scale(1.05);
                    z-index: 10;
                }
                .grid-cell.selected {
                    outline: 2px solid #4f46e5; /* indigo-600 */
                    z-index: 5;
                    box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
                }
                .cell-content {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .hand-name {
                    font-size: clamp(12px, 2.2vw, 20px);
                    font-weight: bold;
                }
                .combo-count {
                    position: absolute;
                    bottom: 2px;
                    right: 3px;
                    font-size: clamp(8px, 1.2vw, 12px);
                    font-weight: normal;
                    color: white;
                    opacity: 0.9;
                    text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.8);
                    padding: 0 1px;
                }
            `}</style>
        </div>
    );
};

export default TrainingPane;