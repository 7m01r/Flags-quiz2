
export interface Country {
  name: string;
  capital: string;
  area: number; // In square km
  flag: string; // Emoji or URL
  code: string;
}

export enum GameMode {
  FLAGS = 'FLAGS',
  CAPITALS = 'CAPITALS',
  AREA = 'AREA'
}

export interface Question {
  id: number;
  type: GameMode;
  questionText: string;
  targetValue: string | number;
  options: (string | number)[];
  country: Country;
  image?: string;
}

export interface GameState {
  score: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isFinished: boolean;
  mode: GameMode;
}
