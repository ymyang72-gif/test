import React from 'react';
import { QuizQuestion, InputMode } from '../types/quiz';
import { Check, X, MousePointer, Hand } from 'lucide-react';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedChoice: number | null; // 1, 2, 3, 4 (locked answer)
  activeDetectedChoice: number | null; // currently held finger count (1, 2, 3, 4)
  holdProgress: number; // 0 to 100
  isAnswered: boolean;
  inputMode: InputMode;
  onSelectOption: (optionIndex: number) => void;
}

const FINGER_ICONS = ['☝️', '✌️', '🤟', '🖐️'];

const CATEGORY_COLORS: Record<string, { badge: string; text: string }> = {
  물리: { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30', text: 'text-sky-400' },
  화학: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', text: 'text-indigo-400' },
  생물: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400' },
  지구과학: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', text: 'text-amber-400' },
};

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  selectedChoice,
  activeDetectedChoice,
  holdProgress,
  isAnswered,
  inputMode,
  onSelectOption,
}) => {
  const categoryStyle = CATEGORY_COLORS[question.category] || CATEGORY_COLORS['물리'];

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
      {/* Top Question Header & Category */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md font-semibold border ${categoryStyle.badge}`}
            >
              {question.category}
            </span>
            <span className="text-slate-400 font-medium">
              {question.gradeLevel}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-medium">
              핵심 개념: <strong className="text-slate-200">{question.keyConcept}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">문항 번호</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
              {String(questionIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Question Statement */}
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-relaxed mb-6">
          <span className="text-cyan-400 font-mono mr-2">Q{questionIndex + 1}.</span>
          {question.question}
        </h2>
      </div>

      {/* 4 Choices Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-3.5 my-2">
        {question.options.map((optionText, idx) => {
          const choiceNumber = idx + 1; // 1, 2, 3, 4
          const isSelected = selectedChoice === choiceNumber;
          const isHolding = !isAnswered && activeDetectedChoice === choiceNumber;
          const isCorrectChoice = question.correctAnswer === choiceNumber;

          // Determine card styling based on quiz state
          let cardBg = 'bg-slate-850/60 hover:bg-slate-800 border-slate-750';
          let borderStyle = 'border-slate-800 hover:border-slate-700';
          let badgeBg = 'bg-slate-800 text-slate-300';
          let textColor = 'text-slate-200';

          if (isAnswered) {
            if (isCorrectChoice) {
              cardBg = 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50';
              badgeBg = 'bg-emerald-500 text-slate-950 font-bold';
              textColor = 'text-emerald-100 font-medium';
            } else if (isSelected && !isCorrectChoice) {
              cardBg = 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50';
              badgeBg = 'bg-rose-500 text-white font-bold';
              textColor = 'text-rose-200';
            } else {
              cardBg = 'bg-slate-900/40 border-slate-800/60 opacity-60';
              textColor = 'text-slate-400';
            }
          } else if (isHolding) {
            cardBg = 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-950/50';
            badgeBg = 'bg-cyan-500 text-slate-950 font-bold';
            textColor = 'text-white font-medium';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => onSelectOption(choiceNumber)}
              className={`relative overflow-hidden w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-4 group ${cardBg} ${borderStyle} ${
                !isAnswered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
              }`}
            >
              {/* Active Hold Progress Fill Background */}
              {isHolding && !isAnswered && (
                <div
                  className="absolute inset-y-0 left-0 bg-cyan-500/20 transition-all duration-75 pointer-events-none"
                  style={{ width: `${holdProgress}%` }}
                />
              )}

              {/* Left: Number Pill + Finger Emoji + Text */}
              <div className="relative z-10 flex items-center gap-3.5 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-mono font-bold transition-transform ${badgeBg} ${
                    isHolding ? 'scale-110 shadow-md' : 'group-hover:scale-105'
                  }`}
                >
                  {choiceNumber}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm sm:text-base leading-snug break-words ${textColor}`}>
                    {optionText}
                  </div>
                </div>
              </div>

              {/* Right: Gesture Icon / State Indicator */}
              <div className="relative z-10 flex items-center gap-2 shrink-0">
                {/* When Answered, show Check or X */}
                {isAnswered && isCorrectChoice && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <Check className="w-4 h-4" />
                    <span>정답</span>
                  </div>
                )}
                {isAnswered && isSelected && !isCorrectChoice && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 text-xs font-semibold">
                    <X className="w-4 h-4" />
                    <span>선택한 오답</span>
                  </div>
                )}

                {/* When holding in Gesture mode */}
                {!isAnswered && isHolding && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-900/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold animate-pulse">
                    <span>{FINGER_ICONS[idx]}</span>
                    <span>{Math.round(holdProgress)}%</span>
                  </div>
                )}

                {/* Idle Gesture badge */}
                {!isAnswered && !isHolding && (
                  <span
                    className="text-lg opacity-70 group-hover:opacity-100 transition-opacity hidden sm:inline"
                    title={`손가락 ${choiceNumber}개 제스처`}
                  >
                    {FINGER_ICONS[idx]}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {inputMode === 'gesture' ? (
            <>
              <Hand className="w-3.5 h-3.5 text-cyan-400" />
              <span>손가락을 1.5초간 들고 있으면 자동 확정됩니다.</span>
            </>
          ) : (
            <>
              <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
              <span>원하는 보기를 마우스로 직접 클릭하거나 키보드(1~4)를 누르세요.</span>
            </>
          )}
        </div>
        <div className="hidden sm:block text-[11px] text-slate-400 font-mono">
          단축키: [1] [2] [3] [4]
        </div>
      </div>
    </div>
  );
};
