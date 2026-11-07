export type SubjectCategory = '물리' | '화학' | '생물' | '지구과학';

export interface QuizQuestion {
  id: number;
  category: SubjectCategory;
  gradeLevel: string; // e.g. '중1', '중2', '중3'
  question: string;
  options: [string, string, string, string]; // exactly 4 options (1, 2, 3, 4)
  correctAnswer: number; // 1, 2, 3, or 4
  explanation: string;
  keyConcept: string;
}

export interface QuizAnswerRecord {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentMs: number;
}

export type InputMode = 'gesture' | 'mouse';

export type CameraStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'permission_denied'
  | 'not_found'
  | 'error';

export interface HandLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface FingerDetectionResult {
  hasHand: boolean;
  fingerCount: number; // 0, 1, 2, 3, 4, 5
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  handConfidence: number;
  landmarks?: HandLandmarkPoint[];
}
