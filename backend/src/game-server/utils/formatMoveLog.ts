import { Piece } from "../types/pieces";

export function formatMoveLog(
    piece: Piece,
    from: string,
    to: string,
    boardAfter: Piece[],
    isCheck: boolean,
    isMate: boolean,
    promotion?: Piece["type"],
    castling?: "O-O" | "O-O-O"
): string {
    if (castling) return castling + (isMate ? "#" : isCheck ? "+" : "");

    const pieceLetterMap = {
        pawn: "",
        knight: "N",
        bishop: "B",
        rook: "R",
        queen: "Q",
        king: "K",
    };

    const prefix = pieceLetterMap[piece.type];

    const target = boardAfter.find(p => p.position === to && p.color !== piece.color);
    const isCapture = !!target;

    let move = "";

    if (piece.type === "pawn" && isCapture) {
        move = from[0] + "x" + to;
    } else {
        move = prefix + (isCapture ? "x" : "") + to;
    }

    if (promotion) move += "=" + promotion[0].toUpperCase();
    if (isMate) move += "#";
    else if (isCheck) move += "+";

    return move;
}
