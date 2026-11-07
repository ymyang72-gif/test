import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizQuestion, QuizAnswerRecord } from '../types/quiz';
import { sound } from '../utils/audio';
import { Trophy, RefreshCw, CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen, Sparkles, Printer } from 'lucide-react';

interface QuizResultViewProps {
  questions: QuizQuestion[];
  answers: Record<number, QuizAnswerRecord>;
  onRestart: () => void;
  onRetryIncorrectOnly?: (incorrectIds: number[]) => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  questions,
  answers,
  onRestart,
}) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Compute statistics
  const totalCount = questions.length;
  let correctCount = 0;

  questions.forEach((q) => {
    if (answers[q.id]?.isCorrect) {
      correctCount += 1;
    }
  });

  const score = Math.round((correctCount / totalCount) * 100);

  // Category breakdown
  const categories = ['물리', '화학', '생물', '지구과학'] as const;
  const categoryStats = categories.map((cat) => {
    const catQuestions = questions.filter((q) => q.category === cat);
    const catCorrect = catQuestions.filter((q) => answers[q.id]?.isCorrect).length;
    return {
      category: cat,
      total: catQuestions.length,
      correct: catCorrect,
      rate: catQuestions.length > 0 ? Math.round((catCorrect / catQuestions.length) * 100) : 0,
    };
  });

  // Confetti & Audio on mount
  useEffect(() => {
    sound.playFanfare();

    if (score >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}
    }
  }, [score]);

  // Encouragement evaluation
  let gradeBadge = '중학 과학 탐구 완성';
  let gradeMessage = '수고하셨습니다! 틀린 문제의 해설을 꼼꼼히 확인해보세요.';
  if (score === 100) {
    gradeBadge = '만점 달성! 중학 과학 마스터';
    gradeMessage = '완벽합니다! 물리, 화학, 생물, 지구과학 전 영역의 핵심 원리를 완벽히 꿰뚫고 있습니다.';
  } else if (score >= 80) {
    gradeBadge = '최우수 과학 영재';
    gradeMessage = '훌륭합니다! 높은 과학적 사고력과 뛰어난 개념 이해도를 보여주셨습니다.';
  } else if (score >= 60) {
    gradeBadge = '우수 과학 탐구자';
    gradeMessage = '기본 개념이 탄탄합니다! 아쉽게 놓친 개념들을 복습하면 곧 100점에 도달할 수 있습니다.';
  }

  const toggleExpand = (id: number) => {
    setExpandedQuestionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      {/* Top Hero Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl text-center mb-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{gradeBadge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            최종 점수 <span className="text-cyan-400 font-mono">{score}점</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-md font-medium">
            총 {totalCount}문제 중 <strong className="text-emerald-400">{correctCount}문제 정답</strong> (정답률 {score}%)
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
            {gradeMessage}
          </p>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={onRestart}
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>처음부터 다시 도전하기</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-3 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>결과 인쇄 / 보관</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Breakdown Matrix */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <span>영역별 성취도 분석</span>
          <span className="text-xs text-slate-500 font-normal">· 중학 과학 4개 영역</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categoryStats.map((item) => (
            <div
              key={item.category}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">{item.category}</span>
                <span className="font-mono text-cyan-400 font-bold">{item.rate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${item.rate}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 text-right font-mono">
                {item.correct} / {item.total} 문항 정답
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question-by-Question Review List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>문항별 정답 및 상세 해설 검토</span>
          </h3>
          <span className="text-xs text-slate-500">문항을 클릭하여 해설을 확인하세요</span>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isCorrect = ans?.isCorrect ?? false;
            const userChoice = ans?.selectedOption ?? null;
            const isExpanded = expandedQuestionId === q.id;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden transition-colors"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(q.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                        <span className="font-mono font-bold text-cyan-400">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="font-medium text-slate-300">[{q.category}]</span>
                        <span className="truncate">{q.keyConcept}</span>
                      </div>
                      <div className="text-sm text-slate-200 font-medium truncate">
                        {q.question}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-300">
                        {userChoice ? `선택: ${userChoice}번` : '미응답'}
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        정답: {q.correctAnswer}번
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/70 border-t border-slate-800 text-xs sm:text-sm space-y-3">
                    {/* Choices review */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const optNum = optIdx + 1;
                        const isCorrectOpt = q.correctAnswer === optNum;
                        const isUserOpt = userChoice === optNum;

                        let optBg = 'bg-slate-900 border-slate-800 text-slate-400';
                        if (isCorrectOpt) {
                          optBg = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-semibold';
                        } else if (isUserOpt && !isCorrectOpt) {
                          optBg = 'bg-rose-950/40 border-rose-500/60 text-rose-300';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${optBg}`}
                          >
                            <span>
                              <strong className="mr-1.5">{optNum}번:</strong> {opt}
                            </span>
                            {isCorrectOpt && <span className="text-[11px] text-emerald-400 font-bold shrink-0">정답</span>}
                            {isUserOpt && !isCorrectOpt && <span className="text-[11px] text-rose-400 font-bold shrink-0">선택</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Scientific Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="font-semibold text-cyan-400 text-xs mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>과학적 원리 및 핵심 해설</span>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
