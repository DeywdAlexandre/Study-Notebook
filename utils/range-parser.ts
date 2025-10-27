import type { RangeMatrix, RangeActions } from '../types';

export const HAND_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const allHands: string[] = [];
for (let i = 0; i < HAND_ORDER.length; i++) {
    for (let j = 0; j < HAND_ORDER.length; j++) {
        const h1 = HAND_ORDER[i];
        const h2 = HAND_ORDER[j];
        if (i < j) {
            allHands.push(`${h1}${h2}s`); // Suited
        } else if (j < i) {
            allHands.push(`${h2}${h1}o`); // Offsuit
        } else {
            allHands.push(`${h1}${h2}`); // Pair
        }
    }
}

const SUITS = ['c', 'd', 'h', 's'];

const ACTIONS = {
    raise: { name: 'Raise', color: '#f97316' }, // orange-500
    call: { name: 'Call', color: '#22c55e' }, // green-500
    allin: { name: 'All-in', color: '#a855f7' } // purple-500
};

/**
 * Gera todas as combinações de naipes específicas para uma mão de poker standard.
 * @param hand A mão em formato standard (ex: "AA", "AKs", "AKo").
 * @returns Uma lista de strings, onde cada string é um combo específico (ex: "AcAd", "AcKc", "AcKd").
 */
export function generateSpecificCombos(hand: string): string[] {
    const combos: string[] = [];
    if (!hand || hand.length < 2) return [];

    const r1 = hand[0];
    const r2 = hand[1];

    if (hand.length === 2) { // Pair
        for (let i = 0; i < SUITS.length; i++) {
            for (let j = i + 1; j < SUITS.length; j++) {
                combos.push(`${r1}${SUITS[i]}${r2}${SUITS[j]}`);
            }
        }
    } else if (hand.endsWith('s')) { // Suited
        for (const suit of SUITS) {
            combos.push(`${r1}${suit}${r2}${suit}`);
        }
    } else if (hand.endsWith('o')) { // Offsuit
        for (let i = 0; i < SUITS.length; i++) {
            for (let j = 0; j < SUITS.length; j++) {
                if (i !== j) {
                    combos.push(`${r1}${SUITS[i]}${r2}${SUITS[j]}`);
                }
            }
        }
    }
    return combos;
}


/**
 * Normaliza uma mão de poker para o formato padrão (ex: KAs -> AKs, TJo -> JTo).
 * @param hand A mão a ser normalizada.
 * @returns A mão normalizada.
 */
function normalizeHand(hand: string): string {
    if (hand.length === 3) { // Suited ou Offsuit
        const [c1, c2, s] = hand.split('');
        const i1 = HAND_ORDER.indexOf(c1);
        const i2 = HAND_ORDER.indexOf(c2);
        return i1 < i2 ? hand : `${c2}${c1}${s}`;
    }
    return hand; // Pares não precisam de normalização
}


/**
 * Converte um formato de mão de solver (ex: "AcKc") para o formato standard (ex: "AKs").
 * @param hand A mão de 4 caracteres do solver.
 * @returns A mão em formato standard ou null se for inválida.
 */
function convertPioHandToStandard(hand: string): string | null {
    if (hand.length !== 4) return null;
    const r1 = hand[0].toUpperCase();
    const s1 = hand[1];
    const r2 = hand[2].toUpperCase();
    const s2 = hand[3];

    const i1 = HAND_ORDER.indexOf(r1);
    const i2 = HAND_ORDER.indexOf(r2);
    if (i1 === -1 || i2 === -1) return null;

    // Garante que a ordem dos ranks é sempre o mais alto primeiro
    const [h_r1, h_r2] = i1 < i2 ? [r1, r2] : [r2, r1];

    if (r1 === r2) { // Par
        return `${h_r1}${h_r2}`;
    } else if (s1 === s2) { // Suited
        return `${h_r1}${h_r2}s`;
    } else { // Offsuit
        return `${h_r1}${h_r2}o`;
    }
}

/**
 * Retorna o número máximo de combos para um tipo de mão standard.
 * @param hand A mão em formato standard (ex: "AA", "AKs", "AKo").
 * @returns O número de combos.
 */
export function getMaxCombos(hand: string): number {
    if (hand.length === 2) return 6;    // Par (ex: AA) tem 6 combos
    if (hand.endsWith('s')) return 4;   // Suited (ex: AKs) tem 4 combos
    if (hand.endsWith('o')) return 12;  // Offsuit (ex: AKo) tem 12 combos
    return 0;
}


/**
 * Analisa o texto bruto de um range de poker no formato de solver (ex: "AcKc:1,AdKd:0.5,...").
 * @param rawText O texto bruto a ser analisado.
 * @returns Uma RangeMatrix que mapeia mãos para as suas cores e pesos.
 */
function parsePioSolverFormat(rawText: string, actionName: string, color: string): RangeMatrix {
    const aggregates: { [hand: string]: number } = {};
    const matrix: RangeMatrix = {};

    const parts = rawText.split(',').map(p => p.trim()).filter(Boolean);

    for (const part of parts) {
        const pair = part.split(':');
        if (pair.length !== 2) continue;
        
        const hand = pair[0].trim();
        const freqStr = pair[1].trim();

        if (!hand || !freqStr) continue;

        const standardHand = convertPioHandToStandard(hand);
        const freq = parseFloat(freqStr);

        if (standardHand && !isNaN(freq)) {
            if (!aggregates[standardHand]) {
                aggregates[standardHand] = 0;
            }
            aggregates[standardHand] += freq;
        }
    }

    for (const hand in aggregates) {
        const totalFreqSum = aggregates[hand];
        const maxCombos = getMaxCombos(hand);
        if (maxCombos > 0) {
            const weight = (totalFreqSum / maxCombos) * 100;
            if (weight > 0) {
                const roundedWeight = Math.round(weight * 100) / 100;
                matrix[hand] = [{ actionName, color, weight: Math.min(roundedWeight, 100) }];
            }
        }
    }
    return matrix;
}

/**
 * Analisa o texto bruto de um range de poker no formato simples (ex: "AA, KK, AQs(50)").
 * @param text O texto bruto a ser analisado.
 * @param actionName O nome da ação a ser atribuída.
 * @param color A cor da ação.
 * @returns Uma RangeMatrix.
 */
function parseSimpleFormat(text: string, actionName: string, color: string): RangeMatrix {
    const matrix: RangeMatrix = {};
    const hands = text.split(/[\s,]+/).filter(Boolean);
    hands.forEach(handStr => {
        const freqMatch = handStr.match(/(.+)\((\d+\.?\d*)\)/);
        let hand = handStr;
        let weight = 100;

        if (freqMatch) {
            hand = freqMatch[1];
            weight = parseFloat(freqMatch[2]);
        }
        
        const normalized = normalizeHand(hand);
        if (allHands.includes(normalized)) {
            if (!matrix[normalized]) {
                matrix[normalized] = [];
            }
            matrix[normalized].push({ actionName, color, weight });
        }
    });
    return matrix;
}

/**
 * Analisa um objeto com strings de range para múltiplas ações e retorna uma matriz combinada.
 * @param rawTextObject O objeto contendo os textos dos ranges.
 * @returns Uma RangeMatrix combinada.
 */
export function parseRangeText(rawTextObject: RangeActions): RangeMatrix {
    let combinedMatrix: RangeMatrix = {};

    const actionsToParse: { key: keyof RangeActions; config: { name: string; color: string } }[] = [
        { key: 'raise', config: ACTIONS.raise },
        { key: 'call', config: ACTIONS.call },
        { key: 'allin', config: ACTIONS.allin }
    ];

    for (const { key, config } of actionsToParse) {
        const text = rawTextObject[key];
        if (text && text.trim()) {
            let actionMatrix: RangeMatrix;
            if (text.includes(':')) {
                actionMatrix = parsePioSolverFormat(text, config.name, config.color);
            } else {
                actionMatrix = parseSimpleFormat(text, config.name, config.color);
            }
            
            // Merge matrix
            for (const hand in actionMatrix) {
                if (!combinedMatrix[hand]) {
                    combinedMatrix[hand] = [];
                }
                combinedMatrix[hand].push(...actionMatrix[hand]);
            }
        }
    }

    return combinedMatrix;
}