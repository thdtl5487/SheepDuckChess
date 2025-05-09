// piece.ts

export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export type PieceColor = "white" | "black";

export interface Piece {
    type: PieceType;
    color: PieceColor;
    position: string; // 예: "e4", "f6"
}
