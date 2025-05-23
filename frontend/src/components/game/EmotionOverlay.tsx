// src/components/game/overlays/EmotionOverlay.tsx
import React from 'react';
import { Piece, pieceValue } from '../../types/piece';

interface EmotionOverlayProps {
  pieces: Piece[];
  /** 보여줄 캐릭터의 색상 (white 또는 black) */
  characterColor: 'white' | 'black';
  /** 유저 설정 스킨 ID */
  skinId: number;
  /** 오버레이 위치: 왼쪽(opponent) 또는 오른쪽(user) */
  side: 'left' | 'right';
  isOpponentConnected: boolean;
}

// material 점수 차에 따라 상태 번호 결정 (1~5)
function getStateNum(diff: number): number {
  if (diff <= -2) return 1;
  if (diff <= -1) return 2;
  if (Math.abs(diff) <= 0) return 3;
  if (diff >= 1) return 4;
  if (diff >= 2) return 5;
  return 3;
}

const EmotionOverlay: React.FC<EmotionOverlayProps> = ({ pieces, characterColor, skinId, side, isOpponentConnected }) => {
  // 전체 점수 계산
  const whiteScore = pieces
    .filter(p => p.color === 'white')
    .reduce((sum, p) => sum + pieceValue[p.type], 0);
  const blackScore = pieces
    .filter(p => p.color === 'black')
    .reduce((sum, p) => sum + pieceValue[p.type], 0);

  // 해당 캐릭터의 점수 차이
  const myScore = characterColor === 'white' ? whiteScore : blackScore;
  const oppScore = characterColor === 'white' ? blackScore : whiteScore;
  const diff = oppScore - myScore;
  const stateNum = getStateNum(diff);

  // 파일명 포맷: {skinId}_{stateNum}.gif
  const imgSrc = `/asset/InGameStandImage/${skinId}_${stateNum}.gif`;

  // 위치 스타일
  const positionClass = side === 'left'
      ? 'fixed max-md:bottom-[-50px] max-md:top-20 max-md:right-10 max-md:-translate-x-1/2 ' +
        'md:bottom-30 md:left-4 md:transform-none md:top-auto'
      : 'fixed max-md:top-4 max-md:right-0 max-md:-translate-x-1/2 ' +
        'md:bottom-30 md:right-4 md:transform-none md:left-auto'



  // 상대측인 경우 좌우 반전
  const flipClass = side === 'right' ? 'transform -scale-x-100' : '';

  return (
    <div className={`${positionClass} pointer-events-none z-0`}>
      <img
        src={imgSrc}
        alt={`emotion-${stateNum}`}
        className={`w-60 h-60 ${flipClass}`}
        style={{filter: isOpponentConnected ? "none" : "grayscale(100%) saturate(50%) brightness(80%)"}}
      />
    </div>
  );
};

export default EmotionOverlay;
