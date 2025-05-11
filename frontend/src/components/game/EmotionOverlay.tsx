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
}

// material 점수 차에 따라 상태 번호 결정 (1~5)
function getStateNum(diff: number): number {
  if (diff <= -8) return 1;
  if (diff <= -4) return 2;
  if (Math.abs(diff) <= 2) return 3;
  if (diff >= 4) return 4;
  if (diff >= 8) return 5;
  return 3;
}

const EmotionOverlay: React.FC<EmotionOverlayProps> = ({ pieces, characterColor, skinId, side }) => {
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
  const diff = myScore - oppScore;
  const stateNum = getStateNum(diff);

  // 파일명 포맷: {skinId}_{stateNum}.gif
  const imgSrc = `/assets/characters/${skinId}_${stateNum}.gif`;

  // 위치 스타일
  const positionClass = side === 'left'
    ? 'absolute bottom-4 left-4'
    : 'absolute bottom-4 right-4';

  // 상대측인 경우 좌우 반전
  const flipClass = side === 'left' ? 'transform -scale-x-100' : '';

  return (
    <div className={`${positionClass} pointer-events-none`}>
      <img
        src={imgSrc}
        alt={`emotion-${stateNum}`}
        className={`w-24 h-24 ${flipClass}`}
      />
    </div>
  );
};

export default EmotionOverlay;
