import type { PokerRange, QuizScenario, PokerPosition, RangeMatrix, QuizAction, StackDepth } from '../types';

export const HAND_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const POSITIONS: PokerPosition[] = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function getHandActions(matrix: RangeMatrix, hand: string): QuizAction[] {
    const actions: QuizAction[] = [];
    const cells = matrix[hand];
    let totalWeight = 0;

    if (cells) {
        for (const cell of cells) {
            if (cell.weight > 0.01) { // Consider actions with meaningful weight
                actions.push({ label: cell.actionName, color: cell.color });
                totalWeight += cell.weight;
            }
        }
    }

    if (totalWeight < 99.9) { // Use a threshold to account for floating point inaccuracies
        actions.push({ label: 'Fold', color: '#808080' }); // Grey for Fold
    }
    
    // In case of an empty cells array or all weights being 0
    if (actions.length === 0) {
        actions.push({ label: 'Fold', color: '#808080' });
    }

    return actions;
}


export function generateRandomScenario(range: PokerRange): QuizScenario | null {
    // Get all stack depths that have defined ranges
    const availableStacks = (Object.keys(range.rangesByStack) as StackDepth[]).filter(stack => {
        const positions = range.rangesByStack[stack];
        // Check if there are any positions defined for this stack and if any of those positions have a matrix with hands
        return positions && Object.keys(positions).length > 0 && Object.values(positions).some(posData => posData && Object.keys(posData.matrix).length > 0);
    });
    
    if (availableStacks.length === 0) {
        return null;
    }
    
    // Pick a random stack depth
    const stackDepth = availableStacks[Math.floor(Math.random() * availableStacks.length)];
    const positionsForStack = range.rangesByStack[stackDepth]!;

    // Get all positions within that stack that have a defined range
    const availablePositions = (Object.keys(positionsForStack) as PokerPosition[]).filter(pos => {
        const posData = positionsForStack[pos];
        return posData && Object.keys(posData.matrix).length > 0;
    });

    if (availablePositions.length === 0) {
        return null; // Should not happen due to the filter on availableStacks
    }

    // Pick a random position
    const heroPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    const matrix = positionsForStack[heroPosition]!.matrix;


    // Escolhe uma mão aleatória de todo o grid de 169 mãos
    const randomRow = HAND_ORDER[Math.floor(Math.random() * HAND_ORDER.length)];
    const randomCol = HAND_ORDER[Math.floor(Math.random() * HAND_ORDER.length)];
    const rowIndex = HAND_ORDER.indexOf(randomRow);
    const colIndex = HAND_ORDER.indexOf(randomCol);
    
    let hand: string;
     if (rowIndex < colIndex) hand = `${randomRow}${randomCol}s`; // Suited
     else if (colIndex < rowIndex) hand = `${randomCol}${randomRow}o`; // Offsuit
     else hand = `${randomRow}${randomCol}`; // Pair

    const correctActions = getHandActions(matrix, hand);
    
    const allPossibleActions = ['Fold', 'Call', 'Raise'];

    return {
        hand,
        heroPosition,
        stackDepth,
        correctActions,
        allPossibleActions
    };
}