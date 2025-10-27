

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Item, RangeContent, ScenarioData } from '../types';
import { getRangeContent, updateRangeContent } from '../services/api';
import ImageUploader from './ImageUploader';
import Icon from './Icon';
import Spinner from './Spinner';

interface RangesPaneProps {
    selectedFolder: Item | null;
}

const ControlButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
}> = ({ isActive, onClick, label }) => (
    <button className={`control-btn ${isActive ? 'active' : ''}`} onClick={onClick}>
        {label}
    </button>
);

const RangesPane: React.FC<RangesPaneProps> = ({ selectedFolder }) => {
    const { heroPositions, villainPositions, initialHero, initialVillain } = useMemo(() => {
        switch(selectedFolder?.rangeType) {
            case 'blind_vs_blind':
                return { 
                    heroPositions: ['SB', 'BB'], 
                    villainPositions: ['SB', 'BB'], 
                    initialHero: 'SB', 
                    initialVillain: 'BB' 
                };
            case 'all_positions':
                 return {
                    heroPositions: ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'],
                    villainPositions: ['EP', 'MP', 'CO', 'BTN', 'SB'],
                    initialHero: 'BTN',
                    initialVillain: 'EP'
                 };
            case 'open_raise':
                return {
                    heroPositions: ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB'],
                    villainPositions: [],
                    initialHero: 'UTG',
                    initialVillain: 'rfi' // Dummy value for data structure
                };
            default: // undefined, for old folders
                return {
                    heroPositions: ['BTN', 'BB'],
                    villainPositions: ['UTG', 'EP', 'MP', 'CO'],
                    initialHero: 'BTN',
                    initialVillain: 'EP'
                };
        }
    }, [selectedFolder]);
    
    const [gameType, setGameType] = useState<'vanilla' | 'bounty'>('vanilla');
    const [heroPosition, setHeroPosition] = useState(initialHero);
    const [villainPosition, setVillainPosition] = useState(initialVillain);
    const [scenario, setScenario] = useState<'chip_ev' | 'cobrindo' | 'coberto'>('chip_ev');
    const [rangeContent, setRangeContent] = useState<RangeContent | null>(null);
    const [status, setStatus] = useState<'loading' | 'idle' | 'ready'>('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingHeader, setIsEditingHeader] = useState(false);

    const DEFAULT_TITLE = 'Ferramenta Interativa de Ranges de Poker';
    const DEFAULT_SUBTITLE = 'Estude estratégias GTO pré-flop para diferentes posições e cenários de jogo (40-50bb de stack).';


    useEffect(() => {
        // This effect runs when `initialHero` or `initialVillain` changes,
        // which happens when `selectedFolder` changes.
        setHeroPosition(initialHero);
        setVillainPosition(initialVillain);
        setGameType('vanilla');
        setScenario('chip_ev');
        setIsEditingHeader(false);
    }, [initialHero, initialVillain]);


    const fetchContent = useCallback(async (folderId: string) => {
        setStatus('loading');
        try {
            const content = await getRangeContent(folderId);
            setRangeContent(content);
        } catch (error) {
            console.error("Failed to load range content", error);
        } finally {
            setStatus('ready');
        }
    }, []);
    
    useEffect(() => {
        if (selectedFolder) {
            fetchContent(selectedFolder.id);
        } else {
            setRangeContent(null);
            setStatus('idle');
        }
    }, [selectedFolder, fetchContent]);

    const currentScenarioData: ScenarioData | null = useMemo(() => {
        if (!rangeContent) return null;
        return rangeContent.data?.[gameType]?.[heroPosition]?.[villainPosition]?.[scenario] || null;
    }, [rangeContent, gameType, heroPosition, villainPosition, scenario]);

    const updateCurrentScenarioData = (updatedData: Partial<ScenarioData>) => {
        if (!rangeContent) return;
        
        const newData: RangeContent = JSON.parse(JSON.stringify(rangeContent)); // Deep copy
        
        if (!newData.data) newData.data = {};
        if (!newData.data[gameType]) newData.data[gameType] = {};
        if (!newData.data[gameType][heroPosition]) newData.data[gameType][heroPosition] = {};
        if (!newData.data[gameType][heroPosition][villainPosition]) newData.data[gameType][heroPosition][villainPosition] = {};

        const defaultScenario: ScenarioData = { image1: null, image2: null, insightsText: '' };
        newData.data[gameType][heroPosition][villainPosition][scenario] = {
            ...(newData.data[gameType][heroPosition][villainPosition][scenario] || defaultScenario),
            ...updatedData,
        };
        
        setRangeContent(newData);
    };
    
    const handleHeaderTextChange = (field: 'headerTitle' | 'headerSubtitle', value: string) => {
        if (!rangeContent) return;
        const newContent: RangeContent = {
            ...rangeContent,
            [field]: value,
        };
        setRangeContent(newContent);
    };

    const handleSave = async () => {
        if (!rangeContent) return;
        setIsSaving(true);
        try {
            await updateRangeContent(rangeContent);
        } catch (error) {
            console.error("Failed to save range content", error);
            alert("Falha ao guardar as alterações.");
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!selectedFolder) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8">
                <Icon name="FolderSearch" size={56} className="mb-4 text-slate-400 dark:text-slate-500" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Selecione uma pasta de HRC</h2>
                <p className="mt-2">Selecione uma pasta na barra lateral para ver ou editar o seu conteúdo.</p>
            </div>
        );
    }
    
    if (status === 'loading') {
        return <div className="h-full flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="poker-tool-body">
            <div className="poker-container">
                <header className="poker-header relative">
                    {!isEditingHeader ? (
                        <>
                            <h1>{rangeContent?.headerTitle ?? DEFAULT_TITLE}</h1>
                            <p>{rangeContent?.headerSubtitle ?? DEFAULT_SUBTITLE}</p>
                            <button
                                onClick={() => setIsEditingHeader(true)}
                                className="absolute top-2 right-2 px-3 py-1 bg-slate-200 text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"
                            >
                                <Icon name="Pencil" size={14} /> Editar Texto
                            </button>
                        </>
                    ) : (
                        <div className="w-full">
                            <input
                                type="text"
                                value={rangeContent?.headerTitle ?? DEFAULT_TITLE}
                                onChange={(e) => handleHeaderTextChange('headerTitle', e.target.value)}
                                className="w-full text-center text-2xl font-bold bg-slate-100 dark:bg-slate-800 rounded p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Título Principal"
                            />
                            <textarea
                                value={rangeContent?.headerSubtitle ?? DEFAULT_SUBTITLE}
                                onChange={(e) => handleHeaderTextChange('headerSubtitle', e.target.value)}
                                className="w-full text-center bg-slate-100 dark:bg-slate-800 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Subtítulo"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => setIsEditingHeader(false)}
                                    className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Icon name="Check" size={16} /> Concluir Edição
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                <div className="controls">
                    <div className="control-group">
                        <h3>Sua Posição (Hero)</h3>
                        <div className="btn-group">
                           {heroPositions.map(pos => <ControlButton key={pos} isActive={heroPosition === pos} onClick={() => setHeroPosition(pos)} label={pos} />)}
                        </div>
                    </div>
                    {villainPositions.length > 0 && (
                        <div className="control-group">
                            <h3>Posição do Adversário (Opener)</h3>
                            <div className="btn-group">
                                {villainPositions.map(pos => <ControlButton key={pos} isActive={villainPosition === pos} onClick={() => setVillainPosition(pos)} label={pos} />)}
                            </div>
                        </div>
                    )}
                    <div className="control-group">
                        <h3>Tipo de Jogo</h3>
                        <div className="btn-group">
                            <ControlButton isActive={gameType === 'vanilla'} onClick={() => setGameType('vanilla')} label="Vanilla" />
                            <ControlButton isActive={gameType === 'bounty'} onClick={() => setGameType('bounty')} label="Bounty" />
                        </div>
                    </div>
                    <div className="control-group">
                        <h3>Cenário de Jogo</h3>
                         <div className="btn-group">
                            <ControlButton isActive={scenario === 'chip_ev'} onClick={() => setScenario('chip_ev')} label="Chip EV" />
                            <ControlButton isActive={scenario === 'cobrindo'} onClick={() => setScenario('cobrindo')} label="Cobrindo" />
                            <ControlButton isActive={scenario === 'coberto'} onClick={() => setScenario('coberto')} label="Coberto" />
                        </div>
                    </div>
                </div>

                <div className="display-area">
                    <ImageUploader 
                        imageSrc={currentScenarioData?.image1 || null}
                        onImageChange={(base64) => updateCurrentScenarioData({ image1: base64 })}
                        className="aspect-[4/3]"
                        placeholderText="Carregar Range"
                    />
                    
                    <div className="info-panel">
                        <div className="summary">
                            <h3>Frequências</h3>
                             <ImageUploader 
                                imageSrc={currentScenarioData?.image2 || null}
                                onImageChange={(base64) => updateCurrentScenarioData({ image2: base64 })}
                                className="h-28"
                                placeholderText="Carregar Frequências"
                            />
                        </div>
                        <div className="insights">
                            <h3>Insights Estratégicos</h3>
                            <textarea
                                value={currentScenarioData?.insightsText || ''}
                                onChange={(e) => updateCurrentScenarioData({ insightsText: e.target.value })}
                                className="w-full h-64 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-sans p-3 resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="Adicione as suas notas e insights aqui..."
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
                            >
                                <Icon name="Save" size={16} />
                                {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .poker-tool-body {
                    --background-color: #f1f5f9; /* slate-100 */
                    --cell-bg-color: #e2e8f0; /* slate-200 */
                    --text-color: #1e293b;    /* slate-800 */
                    --header-color: #0f172a;  /* slate-900 */
                    --border-radius: 8px;
                    --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    
                    font-family: var(--font-family);
                    background-color: transparent;
                    color: var(--text-color);
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    overflow-y: auto;
                }

                .dark .poker-tool-body {
                     --background-color: #1e2023;
                     --cell-bg-color: #1f2937; /* slate-800 */
                     --text-color: #e0e0e0;
                     --header-color: #ffffff;
                }

                .poker-container {
                    width: 100%;
                    max-width: 1050px;
                    background-color: #ffffff;
                    padding: 25px;
                    border-radius: var(--border-radius);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }
                
                .dark .poker-container {
                    background-color: #374151; /* gray-700 */
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                }

                .poker-header {
                    text-align: center;
                    margin-bottom: 25px;
                    border-bottom: 1px solid #e2e8f0; /* slate-200 */
                    padding-bottom: 15px;
                }
                .dark .poker-header {
                    border-bottom-color: #4b5563; /* gray-600 */
                }


                .poker-header h1 {
                    color: var(--header-color);
                    margin: 0 0 10px 0;
                    font-size: 2.2em;
                }

                .poker-header p {
                    margin: 0;
                    font-size: 1.1em;
                    color: #64748b; /* slate-500 */
                }
                 .dark .poker-header p {
                    color: #9ca3af; /* gray-400 */
                 }
                
                .controls {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                
                .control-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .control-group h3 {
                    margin: 0;
                    font-size: 1.1em;
                    color: var(--header-color);
                }

                .btn-group {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 5px;
                    background-color: #e2e8f0; /* slate-200 */
                    padding: 5px;
                    border-radius: 20px;
                }
                .dark .btn-group {
                    background-color: #1f2937; /* slate-800 */
                }


                .control-btn {
                    background-color: transparent;
                    color: var(--text-color);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 0.95em;
                    font-weight: bold;
                    transition: background-color 0.3s, color 0.3s;
                }

                .control-btn.active {
                    background-color: #4f46e5; /* indigo-600 */
                    color: white;
                }
                
                .control-btn:not(.active):hover {
                    background-color: #cbd5e1; /* slate-300 */
                }
                .dark .control-btn:not(.active):hover {
                    background-color: #4b5563; /* gray-600 */
                }


                .display-area {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 30px;
                }

                @media (min-width: 800px) {
                    .display-area {
                        grid-template-columns: 600px 1fr;
                        align-items: start;
                    }
                }

                .info-panel {
                    background-color: var(--cell-bg-color);
                    padding: 20px;
                    border-radius: var(--border-radius);
                }
                
                .summary, .insights {
                    margin-bottom: 20px;
                }
                
                .summary:last-child, .insights:last-child {
                    margin-bottom: 0;
                }

                .summary h3, .insights h3 {
                    margin-top: 0;
                    border-bottom: 1px solid #cbd5e1; /* slate-300 */
                    padding-bottom: 8px;
                    color: var(--header-color);
                }
                .dark .summary h3, .dark .insights h3 {
                     border-bottom-color: #4b5563; /* gray-600 */
                }

            `}</style>
        </div>
    );
};

export default RangesPane;