
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type ItemType = 'folder' | 'note' | 'htmlView' | 'videoFolder' | 'rangeFolder' | 'pokerRange';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  ownerId: string;
  parentId: string | null;
  contentId?: string;
  children?: Item[];
  rangeType?: 'all_positions' | 'blind_vs_blind' | 'open_raise';
}

export interface Note {
    id: string;
    content: string; // HTML from Quill
}

export interface HtmlView {
    id: string;
    htmlContent: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  parentId: string | null;
  description?: string;
}

export interface ScenarioData {
  image1: string | null; // main square image
  image2: string | null; // secondary rectangular image
  insightsText: string;
}

export interface RangeContent {
  id: string; // Corresponds to the rangeFolder.id
  headerTitle?: string;
  headerSubtitle?: string;
  data: {
    // Using index signatures for dynamic keys
    [gameType: string]: {
      [hero: string]: {
        [villain:string]: {
          [scenario: string]: ScenarioData;
        }
      }
    }
  }
}

// Tipos para a nova funcionalidade de Treino de Poker
export interface RangeCell {
  actionName: string;
  color: string;
  weight: number; // 0 a 100
}

export type RangeMatrix = {
  [hand: string]: RangeCell[]; // Array para suportar múltiplas ações/cores numa mão
};

export type PokerPosition = 'UTG' | 'UTG+1' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type StackDepth = '80' | '60' | '50' | '40' | '35' | '30' | '25' | '20' | '17' | '14' | '12';

export interface RangeActions {
    raise?: string;
    call?: string;
    allin?: string;
}

export interface RangeData {
    rawText: RangeActions | string; // Suporta string para migração
    matrix: RangeMatrix;
}

export interface PokerRange {
    id: string; // Corresponds to the pokerRange item's contentId
    name?: string; // Optional name, useful for components like QuizMode
    rangesByStack: {
        [stack in StackDepth]?: {
            [position in PokerPosition]?: RangeData;
        }
    }
}


// Tipos para a nova funcionalidade de Quiz/Simulação
export interface QuizAction {
  label: string;
  color: string;
}

export interface QuizScenario {
  hand: string;
  heroPosition: PokerPosition;
  stackDepth: StackDepth;
  correctActions: QuizAction[];
  allPossibleActions: string[];
}