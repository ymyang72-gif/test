import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SCIENCE_QUESTIONS } from './data/scienceQuestions';
import {
  QuizAnswerRecord,
  InputMode,
  FingerDetectionResult,
} from './types/quiz';
import { Header } from './components/Header';
import { CameraHandView } from './components/CameraHandView';
import { QuizQuestionCard } from './components/QuizQuestionCard';
import { ExplanationCard } from './components/ExplanationCard';
import { QuizResultView } from './components/QuizResultView';
import { GestureHelpModal } from './components/GestureHelpModal';
import { sound } from './utils/audio';
import {
  Hand,
  MousePointer,
  HelpCircle,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';

const HOLD_DURATION_MS = 1500; // 1.5 seconds hold to confirm

export default function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, QuizAnswerRecord>>({});
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Input & Camera modes
  const [inputMode, setInputMode] = useState<InputMode>('gesture');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Gesture tracking & 1.5s hold progress
  const [activeDetectedChoice, setActiveDetectedChoice] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Gesture timer state refs (to avoid frame delays)
  const candidateChoiceRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const isAnsweredRef = useRef<boolean>(false);
  isAnsweredRef.current = isAnswered;

  const currentQuestion = SCIENCE_QUESTIONS[currentQuestionIndex];
  const totalQuestions = SCIENCE_QUESTIONS.length;

  // Confirm choice submission
  const handleConfirmChoice = useCallback(
    (choiceNumber: number) => {
      if (isAnsweredRef.current) return;

      const question = SCIENCE_QUESTIONS[currentQuestionIndex];
      const isCorrect = choiceNumber === question.correctAnswer;

      setSelectedChoice(choiceNumber);
      setIsAnswered(true);
      isAnsweredRef.current = true;
      setHoldProgress(100);

      sound.playLockIn();
      if (isCorrect) {
        setTimeout(() => sound.playCorrect(), 120);
      } else {
        setTimeout(() => sound.playIncorrect(), 120);
      }

      setAnswers((prev) => ({
        ...prev,
        [question.id]: {
          questionId: question.id,
          selectedOption: choiceNumber,
          isCorrect,
          timeSpentMs: 0,
        },
      }));
    },
    [currentQuestionIndex]
  );

  // Handle incoming finger detection from CameraHandView
  const handleFingerDetected = useCallback(
    (result: FingerDetectionResult | null) => {
      if (isAnsweredRef.current || inputMode !== 'gesture') {
        setActiveDetectedChoice(null);
        setHoldProgress(0);
        candidateChoiceRef.current = null;
        holdStartTimeRef.current = null;
        return;
      }

      const now = performance.now();

      // Check if finger count is in valid range 1 to 4
      if (result && result.hasHand && result.fingerCount >= 1 && result.fingerCount <= 4) {
        const choice = result.fingerCount;

        if (candidateChoiceRef.current !== choice) {
          // Changed to a new choice number: start holding
          candidateChoiceRef.current = choice;
          holdStartTimeRef.current = now;
          lastTickTimeRef.current = now;
          setActiveDetectedChoice(choice);
          setHoldProgress(0);
        } else if (holdStartTimeRef.current !== null) {
          // Same choice being held steadily
          const elapsed = now - holdStartTimeRef.current;
          const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
          setHoldProgress(progress);

          // Emit soft ticking sound every 350ms
          if (now - lastTickTimeRef.current >= 350) {
            sound.playTick();
            lastTickTimeRef.current = now;
          }

          // Completed 1.5 seconds!
          if (elapsed >= HOLD_DURATION_MS) {
            candidateChoiceRef.current = null;
            holdStartTimeRef.current = null;
            handleConfirmChoice(choice);
          }
        }
      } else {
        // No hand or 0 / 5 fingers: reset hold timer
        if (candidateChoiceRef.current !== null) {
          candidateChoiceRef.current = null;
          holdStartTimeRef.current = null;
          setActiveDetectedChoice(null);
          setHoldProgress(0);
        }
      }
    },
    [handleConfirmChoice, inputMode]
  );

  // Advance to next question or complete quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsAnswered(false);
      isAnsweredRef.current = false;
      setSelectedChoice(null);
      setActiveDetectedChoice(null);
      setHoldProgress(0);
      candidateChoiceRef.current = null;
      holdStartTimeRef.current = null;
    } else {
      setIsCompleted(true);
    }
  };

  // Swipe right-to-left gesture triggers next question
  const handleSwipeNext = useCallback(() => {
    if (isAnsweredRef.current) {
      sound.playNext();
      handleNextQuestion();
    }
  }, [currentQuestionIndex]);

  // Restart quiz
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsAnswered(false);
    isAnsweredRef.current = false;
    setSelectedChoice(null);
    setActiveDetectedChoice(null);
    setHoldProgress(0);
    setIsCompleted(false);
    candidateChoiceRef.current = null;
    holdStartTimeRef.current = null;
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  // Keyboard shortcut listener (1, 2, 3, 4 for choices; Enter / Space for next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (!isAnswered && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const choice = parseInt(e.key, 10);
        handleConfirmChoice(choice);
      } else if (isAnswered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, handleConfirmChoice]);

  // Running Score tally
  const currentScore = Object.values(answers).filter((a) => a.isCorrect).length * 10;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Bar Contract compliant Header */}
      <Header
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        inputMode={inputMode}
        onToggleInputMode={() =>
          setInputMode((prev) => (prev === 'gesture' ? 'mouse' : 'gesture'))
        }
        onRestart={handleRestart}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Global Progress Bar Strip */}
      <div className="w-full bg-slate-900 h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
          style={{
            width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {isCompleted ? (
          <QuizResultView
            questions={SCIENCE_QUESTIONS}
            answers={answers}
            onRestart={handleRestart}
          />
        ) : (
          <div className="w-full">
            {/* Context bar above workspace */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-white">중학교 과학 교육과정 10문항</span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-400 font-mono">
                  {inputMode === 'gesture' ? 'MediaPipe 제스처 인식 모드' : '마우스 직접 클릭 모드'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  현재 점수: <strong className="text-emerald-400 font-bold">{currentScore}점</strong>
                </div>
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>이용 방법</span>
                </button>
              </div>
            </div>

            {/* Two-Zone Layout: Left Camera Stage, Right Quiz Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Zone 1: Camera Stage (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {inputMode === 'gesture' ? (
                  <CameraHandView
                    onFingerDetected={handleFingerDetected}
                    holdProgress={holdProgress}
                    targetChoice={activeDetectedChoice}
                    isAnswerLocked={isAnswered}
                    onSwitchToMouse={() => setInputMode('mouse')}
                    onSwipeNext={handleSwipeNext}
                  />
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                      <MousePointer className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      마우스 클릭 모드 활성화됨
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                      원하는 보기를 직접 클릭하거나 키보드 숫자키(1~4)를 눌러 바로 풀 수 있습니다.
                    </p>
                    <button
                      onClick={() => setInputMode('gesture')}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2"
                    >
                      <Hand className="w-4 h-4" />
                      <span>카메라 제스처 모드로 전환</span>
                    </button>
                  </div>
                )}

                {/* Gesture Quick Indicator Bar */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">
                      브라우저 로컬 비전 AI (개인정보 안전)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    1.5초 유지 확정
                  </span>
                </div>
              </div>

              {/* Zone 2: Question & Choices Stage (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col">
                <QuizQuestionCard
                  question={currentQuestion}
                  questionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  selectedChoice={selectedChoice}
                  activeDetectedChoice={activeDetectedChoice}
                  holdProgress={holdProgress}
                  isAnswered={isAnswered}
                  inputMode={inputMode}
                  onSelectOption={handleConfirmChoice}
                />

                {/* Explanation Card upon Answer */}
                {isAnswered && selectedChoice !== null && (
                  <ExplanationCard
                    question={currentQuestion}
                    selectedChoice={selectedChoice}
                    isCorrect={selectedChoice === currentQuestion.correctAnswer}
                    isLastQuestion={currentQuestionIndex === totalQuestions - 1}
                    onNextQuestion={handleNextQuestion}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>중학교 과학 4지선다 인터랙티브 제스처 퀴즈 · MediaPipe Tasks Vision AI</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>클라이언트 로컬 분석 · 영상 외부 전송 없음</span>
          </span>
        </div>
      </footer>

      {/* Help Modal */}
      <GestureHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSwitchToMouse={() => setInputMode('mouse')}
      />
    </div>
  );
}
