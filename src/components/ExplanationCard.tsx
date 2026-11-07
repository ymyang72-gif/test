import React from 'react';
import { QuizQuestion } from '../types/quiz';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Award } from 'lucide-react';

interface ExplanationCardProps {
  question: QuizQuestion;
  selectedChoice: number;
  isCorrect: boolean;
  isLastQuestion: boolean;
  onNextQuestion: () => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  question,
  selectedChoice,
  isCorrect,
  isLastQuestion,
  onNextQuestion,
}) => {
  return (
    <div className="w-full mt-4 bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
      {/* Top Result Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isCorrect ? '정답입니다! (+10점)' : '아쉽습니다! 오답입니다.'}
              </h3>
              <span className="text-xs text-slate-400">
                (선택: {selectedChoice}번 / 정답: {question.correctAnswer}번)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              핵심 개념: <strong className="text-slate-200">{question.keyConcept}</strong>
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <button
            onClick={onNextQuestion}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
          >
            <span>{isLastQuestion ? '최종 결과 확인하기' : '다음 문제로 이동'}</span>
            {isLastQuestion ? (
              <Award className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
          <span className="text-[11px] text-slate-400 text-center sm:text-right">
            단축키: Enter / Space 또는 손 스와이프
          </span>
        </div>
      </div>

      {/* Swipe Left Gesture Hint Strip */}
      <div className="mt-3.5 py-2 px-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
        <div className="flex items-center gap-2">
          <span className="text-base animate-pulse">👋</span>
          <span>
            손을 <strong className="text-white">오른쪽에서 왼쪽(Right ➔ Left)</strong>으로 넘기면 다음 문제로 이동합니다!
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] bg-slate-900/80 px-2.5 py-0.5 rounded-md border border-cyan-400/30 text-cyan-300">
          <span>제스처:</span>
          <span className="font-bold">← 스와이프</span>
        </div>
      </div>

      {/* Correct Choice Reference Box */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
        <div className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
          정답 {question.correctAnswer}번
        </div>
        <div className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
          {question.options[question.correctAnswer - 1]}
        </div>
      </div>

      {/* Detailed Science Explanation */}
      <div className="mt-3.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1.5">
          <BookOpen className="w-4 h-4" />
          <span>과학 원리 및 정답 해설</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {question.explanation}
        </p>
      </div>
    </div>
  );
};
