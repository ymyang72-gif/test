import React from 'react';
import { X, Hand, ShieldCheck, CheckCircle2, Clock, MousePointer } from 'lucide-react';

interface GestureHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToMouse: () => void;
}

export const GestureHelpModal: React.FC<GestureHelpModalProps> = ({
  isOpen,
  onClose,
  onSwitchToMouse,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">손동작(제스처) 인식 퀴즈 가이드</h2>
            <p className="text-xs text-slate-400">카메라 앞에서 손가락을 들어 직관적으로 문제를 풀어보세요</p>
          </div>
        </div>

        {/* 4 gestures grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center flex flex-col items-center">
            <span className="text-3xl mb-1.5 select-none">☝️</span>
            <span className="text-xs font-semibold text-cyan-300">손가락 1개</span>
            <span className="text-[11px] text-slate-400 mt-0.5">1번 보기 선택</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center flex flex-col items-center">
            <span className="text-3xl mb-1.5 select-none">✌️</span>
            <span className="text-xs font-semibold text-cyan-300">손가락 2개</span>
            <span className="text-[11px] text-slate-400 mt-0.5">2번 보기 선택</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center flex flex-col items-center">
            <span className="text-3xl mb-1.5 select-none">🤟</span>
            <span className="text-xs font-semibold text-cyan-300">손가락 3개</span>
            <span className="text-[11px] text-slate-400 mt-0.5">3번 보기 선택</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center flex flex-col items-center">
            <span className="text-3xl mb-1.5 select-none">🖐️</span>
            <span className="text-xs font-semibold text-cyan-300">손가락 4개</span>
            <span className="text-[11px] text-slate-400 mt-0.5">4번 보기 선택</span>
          </div>
        </div>

        {/* Key rules */}
        <div className="space-y-2.5 text-xs text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">1.5초 유지 시 자동 확정:</strong> 선택하고 싶은 번호의 손가락 개수를 유지하면 게이지가 100% 차오르며 자동으로 정답이 제출됩니다.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0">👋</span>
            <div>
              <strong className="text-white">오른쪽 ➔ 왼쪽 스와이프로 다음 문제 이동:</strong> 문제 정답을 선택한 후 손을 화면 오른쪽에서 왼쪽으로 휙 넘기면 다음 문제로 편리하게 이동합니다.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">인식 팁:</strong> 카메라와 40~70cm 정도 거리를 두고, 손바닥이나 손가락이 화면 중앙에 잘 보이도록 펼쳐주세요.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">개인정보 안심 보장:</strong> MediaPipe Vision AI는 브라우저 내부에서만 실행되며 영상은 외부 서버로 전송되지 않습니다.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              onSwitchToMouse();
              onClose();
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>마우스로만 풀기</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-600/20"
          >
            이해했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
