import React from 'react';
import { Volume2, VolumeX, MousePointer, Hand, RefreshCw, ShieldCheck } from 'lucide-react';
import { InputMode } from '../types/quiz';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  inputMode: InputMode;
  onToggleInputMode: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  inputMode,
  onToggleInputMode,
  onRestart,
  isMuted,
  onToggleMute,
  onOpenHelp,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#" onClick={(e) => { e.preventDefault(); onRestart(); }} className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-black shadow-inner shadow-cyan-300/30">
            科
          </span>
          <span>중학 과학 제스처 퀴즈</span>
        </a>
      </div>

      {/* Zone 2: 4 clean single-line nav / status items */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenHelp}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Hand className="w-3.5 h-3.5 text-cyan-400" />
          <span>손가락 1~4 제스처 가이드</span>
        </button>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-slate-300">
          <span className="text-cyan-400 font-mono font-semibold">1.5s</span>
          <span>유지 시 자동 확정</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% 브라우저 로컬 처리</span>
        </div>
        <div className="text-slate-400 font-mono tabular-nums whitespace-nowrap">
          진행도: <strong className="text-white">{Math.min(currentQuestionIndex + 1, totalQuestions)}</strong> / {totalQuestions}
        </div>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Sound toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? '음소거 해제' : '음소거'}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          aria-label="효과음 설정"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Input Mode Toggle */}
        <button
          onClick={onToggleInputMode}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
          title="입력 모드 전환 (제스처 / 마우스)"
        >
          {inputMode === 'gesture' ? (
            <>
              <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
              <span>마우스 모드로 풀기</span>
            </>
          ) : (
            <>
              <Hand className="w-3.5 h-3.5 text-emerald-400" />
              <span>제스처 모드로 풀기</span>
            </>
          )}
        </button>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="퀴즈 처음부터 다시 시작"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">다시 시작</span>
        </button>
      </div>
    </header>
  );
};
