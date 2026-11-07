import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, AlertTriangle, RefreshCw, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { CameraStatus, FingerDetectionResult } from '../types/quiz';
import { analyzeHandLandmarks } from '../utils/fingerDetector';

interface CameraHandViewProps {
  onFingerDetected: (result: FingerDetectionResult | null) => void;
  holdProgress: number; // 0 to 100
  targetChoice: number | null; // 1, 2, 3, or 4 currently being held
  isAnswerLocked: boolean;
  onSwitchToMouse: () => void;
  onSwipeNext?: () => void;
}

// Landmark connection pairs for drawing the hand skeleton
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

export const CameraHandView: React.FC<CameraHandViewProps> = ({
  onFingerDetected,
  holdProgress,
  targetChoice,
  isAnswerLocked,
  onSwitchToMouse,
  onSwipeNext,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Swipe detection history
  const handHistoryRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastSwipeTimeRef = useRef<number>(0);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentFingerCount, setCurrentFingerCount] = useState<number>(0);
  const [hasHand, setHasHand] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [swipeTriggered, setSwipeTriggered] = useState<boolean>(false);

  // Initialize MediaPipe HandLandmarker
  const initHandLandmarker = useCallback(async () => {
    try {
      setCameraStatus('initializing');
      setErrorMessage('');

      // Load MediaPipe Vision WASM from reliable CDN
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      let landmarker: HandLandmarker;
      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch {
        // Fallback to CPU delegate if GPU is unsupported or restricted
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      landmarkerRef.current = landmarker;

      // Start webcam stream
      await startCamera();
    } catch (err: unknown) {
      console.error('Failed to init MediaPipe:', err);
      setCameraStatus('error');
      setErrorMessage('MediaPipe AI 모델 초기화에 실패했습니다. 마우스 모드로 퀴즈를 계속하실 수 있습니다.');
    }
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('not_found');
        setErrorMessage('이 브라우저 환경에서는 웹캠에 접근할 수 없습니다.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraStatus('ready');
        };
      }
    } catch (err: unknown) {
      console.error('Webcam error:', err);
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraStatus('permission_denied');
        setErrorMessage('브라우저 카메라 접근 권한이 거부되었습니다.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraStatus('not_found');
        setErrorMessage('연결된 카메라 장치를 찾을 수 없습니다.');
      } else {
        setCameraStatus('error');
        setErrorMessage('카메라를 시작하는 중 문제가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    }
  };

  // Main detection and drawing loop
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (
        cameraStatus === 'ready' &&
        video &&
        video.readyState >= 2 &&
        canvas &&
        landmarker
      ) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;

            const startTimeMs = performance.now();
            const detections = landmarker.detectForVideo(video, startTimeMs);

            if (detections.landmarks && detections.landmarks.length > 0) {
              const landmarks = detections.landmarks[0];
              const handedness =
                detections.handednesses && detections.handednesses[0]?.[0]?.categoryName === 'Left'
                  ? 'Left'
                  : 'Right';

              const result = analyzeHandLandmarks(landmarks, handedness);

              setHasHand(true);
              setCurrentFingerCount(result.fingerCount);
              onFingerDetected(result);

              // Swipe detection when question has been answered
              if (isAnswerLocked) {
                const wrist = landmarks[0];
                const middleMcp = landmarks[9];
                const rawPalmX = (wrist.x + middleMcp.x) / 2;
                const rawPalmY = (wrist.y + middleMcp.y) / 2;
                // In user screen view space (0 = screen left, 1 = screen right):
                const screenX = isMirrored ? 1 - rawPalmX : rawPalmX;
                const screenY = rawPalmY;
                const now = performance.now();

                handHistoryRef.current.push({ x: screenX, y: screenY, time: now });
                // Keep only samples from last 450ms
                handHistoryRef.current = handHistoryRef.current.filter((s) => now - s.time <= 450);

                // Swipe detection: check if hand moved from right to left (dx < -0.16)
                if (now - lastSwipeTimeRef.current > 1000) {
                  const pastCandidates = handHistoryRef.current.filter(
                    (s) => now - s.time >= 100 && now - s.time <= 400
                  );

                  for (const past of pastCandidates) {
                    const dx = screenX - past.x;
                    const dy = screenY - past.y;

                    // Right-to-left swipe on screen: dx is negative and movement is mostly horizontal
                    if (dx < -0.16 && Math.abs(dx) > Math.abs(dy) * 0.7) {
                      lastSwipeTimeRef.current = now;
                      handHistoryRef.current = [];
                      setSwipeTriggered(true);
                      setTimeout(() => setSwipeTriggered(false), 900);
                      if (onSwipeNext) {
                        onSwipeNext();
                      }
                      break;
                    }
                  }
                }
              } else {
                handHistoryRef.current = [];
              }

              // Draw hand skeleton on canvas
              drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, result);
            } else {
              setHasHand(false);
              setCurrentFingerCount(0);
              onFingerDetected(null);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    if (cameraStatus === 'ready') {
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraStatus, onFingerDetected, isAnswerLocked, isMirrored, onSwipeNext]);

  // Clean up on unmount
  useEffect(() => {
    initHandLandmarker();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [initHandLandmarker]);

  // Draw hand bones and joints with modern glowing aesthetic
  const drawHandSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number }[],
    width: number,
    height: number,
    result: FingerDetectionResult
  ) => {
    // Determine glow color based on whether an active choice is being held
    const isHolding = targetChoice !== null && holdProgress > 0;
    const strokeColor = isHolding ? '#06b6d4' : '#38bdf8'; // Cyan to sky blue
    const jointColor = isHolding ? '#22d3ee' : '#7dd3fc';

    // Draw connection lines
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // Reset shadow for joints
    ctx.shadowBlur = 4;

    // Draw joints
    landmarks.forEach((p, idx) => {
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const radius = isTip ? 6 : 4;

      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#ffffff' : jointColor;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    });

    // Draw fingertip number pill if finger is actively signaled
    if (result.fingerCount >= 1 && result.fingerCount <= 4) {
      const wrist = landmarks[0];
      const x = wrist.x * width;
      const y = Math.max(20, wrist.y * height - 35);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 36, y - 18, 72, 28, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`보기 ${result.fingerCount}번`, x, y - 4);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex flex-col">
      {/* Video / Canvas viewport */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Loading overlay */}
        {cameraStatus === 'initializing' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-4" />
            <h4 className="text-sm font-semibold text-white">MediaPipe AI 모델 준비 중...</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              손가락 랜드마크 분석 엔진을 브라우저에 로컬 로드하고 있습니다
            </p>
            <button
              onClick={onSwitchToMouse}
              className="mt-4 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              기다리지 않고 마우스로 시작하기
            </button>
          </div>
        )}

        {/* Permission Denied or Camera Error Fallback Card */}
        {(cameraStatus === 'permission_denied' ||
          cameraStatus === 'not_found' ||
          cameraStatus === 'error') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {cameraStatus === 'permission_denied' ? '카메라 권한이 필요합니다' : '카메라를 연결할 수 없습니다'}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
              {errorMessage || '웹캠을 허용하지 않아도 모든 퀴즈 문제를 마우스 클릭으로 편리하게 푸실 수 있습니다.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={onSwitchToMouse}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>마우스 모드로 진행하기</span>
              </button>
              {cameraStatus === 'permission_denied' && (
                <button
                  onClick={startCamera}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>카메라 다시 시도</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actual Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Overlay Canvas for Hand Landmark Drawing */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-300 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Real-time Circular Hold Progress HUD (Center overlay during hold) */}
        {targetChoice !== null && holdProgress > 0 && !isAnswerLocked && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/30 backdrop-blur-[1px] animate-in fade-in duration-150">
            <div className="relative flex flex-col items-center justify-center">
              {/* Radial Progress Ring */}
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#06b6d4"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * holdProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75 ease-out"
                  />
                </svg>
                {/* Center countdown label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-2xl font-bold font-mono tracking-tight">
                    {targetChoice}번
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {((1500 * (100 - holdProgress)) / 100000).toFixed(1)}s
                  </span>
                </div>
              </div>

              <div className="mt-2 px-3 py-1 bg-slate-900/90 rounded-full border border-cyan-500/40 text-xs font-semibold text-cyan-200 shadow-lg">
                1.5초 유지 확정 중...
              </div>
            </div>
          </div>
        )}

        {/* Lock-in success burst & Swipe Prompt */}
        {isAnswerLocked && (
          <>
            {swipeTriggered ? (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-cyan-950/60 backdrop-blur-sm animate-in zoom-in duration-150">
                <div className="px-6 py-4 rounded-2xl bg-cyan-600 border border-cyan-300 text-white flex items-center gap-3 shadow-2xl scale-105 transition-transform">
                  <span className="text-2xl animate-bounce">➡️</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-cyan-100">스와이프 제스처 감지!</div>
                    <div className="text-sm font-bold">다음 문제로 이동 중...</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-x-3 bottom-12 pointer-events-none flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-400/60 shadow-xl flex items-center gap-2.5 text-cyan-200">
                  <span className="text-base animate-pulse">👋</span>
                  <span className="text-xs font-semibold">
                    손을 <strong className="text-white">오른쪽 ➔ 왼쪽</strong>으로 넘기면 다음 문제로 이동!
                  </span>
                  <span className="text-cyan-400 font-mono text-xs font-bold">←──</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Top Floating Badges in Camera View */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300">
            {hasHand ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">
                  손 감지됨 (손가락: {currentFingerCount}개)
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>손을 카메라에 비춰주세요</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className="pointer-events-auto p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="화면 좌우 반전"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Status bar inside Camera card */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">영상은 서버로 전송되지 않습니다</span>
          </div>

          {currentFingerCount >= 1 && currentFingerCount <= 4 && (
            <div className="px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/50 text-[11px] font-bold text-cyan-300 shadow-md">
              {currentFingerCount === 1 && '☝️ 1번 선택 중'}
              {currentFingerCount === 2 && '✌️ 2번 선택 중'}
              {currentFingerCount === 3 && '🤟 3번 선택 중'}
              {currentFingerCount === 4 && '🖐️ 4번 선택 중'}
            </div>
          )}
        </div>
      </div>

      {/* Guide Banner Underneath Video */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          {isAnswerLocked ? (
            <span className="text-cyan-300 font-medium">
              💡 손을 <strong className="text-white">오른쪽에서 왼쪽</strong>으로 스와이프하면 다음 문제로 넘어갑니다!
            </span>
          ) : (
            <span>
              손가락 <strong className="text-slate-200">1~4개</strong>를 펴서 <strong className="text-cyan-400">1.5초</strong> 동안 유지하세요
            </span>
          )}
        </div>
        <button
          onClick={onSwitchToMouse}
          className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors shrink-0 text-[11px]"
        >
          마우스 클릭으로 풀기
        </button>
      </div>
    </div>
  );
};
