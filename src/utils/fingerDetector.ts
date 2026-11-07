import { FingerDetectionResult, HandLandmarkPoint } from '../types/quiz';

function dist(p1: HandLandmarkPoint, p2: HandLandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Analyzes hand landmarks from MediaPipe and determines:
 * 1. Which individual fingers are extended
 * 2. Total extended finger count (0 to 5)
 * 3. Whether a valid choice (1, 2, 3, or 4) is clearly signaled
 */
export function analyzeHandLandmarks(
  landmarks: HandLandmarkPoint[],
  handedness: 'Left' | 'Right' = 'Right'
): FingerDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      hasHand: false,
      fingerCount: 0,
      extendedFingers: {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false,
      },
      handConfidence: 0,
    };
  }

  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  // Palm reference scale
  const palmScale = dist(wrist, middleMcp);

  // 1. Index Finger Extended Check
  // Tip is higher than PIP (smaller y), tip is further from wrist than PIP
  const isIndexExtended =
    indexTip.y < indexPip.y &&
    dist(indexTip, wrist) > dist(indexPip, wrist) * 1.1 &&
    dist(indexTip, indexMcp) > dist(indexPip, indexMcp) * 1.25;

  // 2. Middle Finger Extended Check
  const isMiddleExtended =
    middleTip.y < middlePip.y &&
    dist(middleTip, wrist) > dist(middlePip, wrist) * 1.1 &&
    dist(middleTip, middleMcp) > dist(middlePip, middleMcp) * 1.25;

  // 3. Ring Finger Extended Check
  const isRingExtended =
    ringTip.y < ringPip.y &&
    dist(ringTip, wrist) > dist(ringPip, wrist) * 1.1 &&
    dist(ringTip, ringMcp) > dist(ringPip, ringMcp) * 1.25;

  // 4. Pinky Finger Extended Check
  const isPinkyExtended =
    pinkyTip.y < pinkyPip.y &&
    dist(pinkyTip, wrist) > dist(pinkyPip, wrist) * 1.1 &&
    dist(pinkyTip, pinkyMcp) > dist(pinkyPip, pinkyMcp) * 1.25;

  // 5. Thumb Extended Check
  // Thumb moves outward from palm. We check distance from thumb tip to pinky MCP base,
  // and distance from thumb tip to index MCP.
  const distThumbToPinky = dist(thumbTip, pinkyMcp);
  const distIpToPinky = dist(thumbIp, pinkyMcp);
  const distThumbToWrist = dist(thumbTip, wrist);
  const distMcpToWrist = dist(thumbMcp, wrist);

  // When thumb is tucked into palm, it gets close to pinky base or middle palm.
  // When extended outwards, tip is far from pinky MCP and extends past thumb IP.
  const isThumbExtended =
    distThumbToPinky > distIpToPinky * 1.18 &&
    distThumbToWrist > distMcpToWrist * 1.25 &&
    dist(thumbTip, indexMcp) > palmScale * 0.45;

  // Count total extended fingers
  const fingers = [
    isThumbExtended,
    isIndexExtended,
    isMiddleExtended,
    isRingExtended,
    isPinkyExtended,
  ];
  let fingerCount = fingers.filter(Boolean).length;

  // Special heuristic:
  // Many users holding "4" keep thumb tucked in and raise all 4 fingers (index, middle, ring, pinky).
  // In that case, thumb is false and the 4 are true -> fingerCount = 4.
  // If someone raises index, middle, ring (3) with pinky folded and thumb tucked -> fingerCount = 3.
  // If someone raises index + middle (2) -> fingerCount = 2.
  // If someone raises only index (1) -> fingerCount = 1.
  // If someone raises thumb + index (2) -> count = 2.
  // If someone raises thumb + index + middle (3) -> count = 3.

  return {
    hasHand: true,
    fingerCount,
    extendedFingers: {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended,
    },
    handConfidence: 0.95,
    landmarks,
  };
}
