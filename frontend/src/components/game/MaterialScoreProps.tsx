import React from "react";
import { Piece, pieceValue } from '../../types/piece';

interface MaterialScoreProps {
  pieces: Piece[];
}

const MaterialScore: React.FC<MaterialScoreProps> = ({ pieces }) => {
  const whiteScore = pieces
    .filter(p => p.color === 'white')
    .reduce((sum, p) => sum + pieceValue[p.type], 0);
  const blackScore = pieces
    .filter(p => p.color === 'black')
    .reduce((sum, p) => sum + pieceValue[p.type], 0);

  return (
    <div className="absolute top-4 left-4 p-2 bg-gray-800 bg-opacity-75 text-white rounded-md">
      <div className="mb-1">💎 White: {whiteScore}</div>
      <div>💎 Black: {blackScore}</div>
    </div>
  );
};

export default MaterialScore;

