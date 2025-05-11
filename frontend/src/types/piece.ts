// piece.ts

export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export type PieceColor = "white" | "black";

export interface Piece {
    type: PieceType;
    color: PieceColor;
    position: string; // 예: "e4", "f6"
}


// 각 기물의 점수 (material value)
export const pieceValue: Record<PieceType, number> = {
    pawn:   1,
    knight: 3,
    bishop: 3,
    rook:   5,
    queen:  9,
    king:   0, // King은 점수 계산에서 제외
};
