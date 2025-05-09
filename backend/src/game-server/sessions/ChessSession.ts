// ChessSession.ts
import { Piece } from "../types/pieces";
import {
    initialBoard,
    isValidMove,
    isKingInCheck,
    isCheckmate,
    isStalemate,
    isInsufficientMaterial,
    promote,
    isCastlingMove,
} from "../core/ChessRules";
import { formatMoveLog } from "../utils/formatMoveLog";

export class ChessSession {
    private pieces: Piece[];
    private turn: "white" | "black";
    private moved: { [pos: string]: boolean };
    private logs: string[];
    private enPassantTarget: string | null;
    private result: "ongoing" | "white_win" | "black_win" | "draw";

    constructor() {
        this.pieces = [...initialBoard];
        this.turn = "white";
        this.logs = [];
        this.moved = {};
        this.enPassantTarget = null;
        this.result = "ongoing";
    }

    getGameState() {
        return {
            board: this.pieces,
            turn: this.turn,
            logs: this.logs,
            result: this.result,
        };
    }

    applyMove(from: string, to: string): { success: boolean; log?: string } {
        if (this.result !== "ongoing") return { success: false };

        const piece = this.pieces.find(p => p.position === from);
        if (!piece || piece.color !== this.turn) return { success: false };

        if (!isValidMove(from, to, piece.type, piece.color, this.pieces, this.moved, this.enPassantTarget)) {
            return { success: false };
        }

        // 캐슬링
        const castling = isCastlingMove(from, to, piece.type, piece.color, this.pieces, this.moved);

        if (castling) {
            // 캐슬링 처리: 킹 이동
            this.pieces = this.pieces.filter(p =>
                p.position !== from && p.position !== castling.rookFrom
            );

            const rook = this.pieces.find(p => p.position === castling.rookFrom);

            this.pieces.push({ ...piece, position: to });

            if (rook) {
                this.pieces.push({ ...rook, position: castling.rookTo });
            }

            this.moved[from] = true;
            this.moved[castling.rookFrom] = true;

            // log 생성 + 턴 전환 + 체크메이트 판정 등 동일
            const nextTurn = this.turn === "white" ? "black" : "white";
            const check = isKingInCheck(nextTurn, this.pieces);
            const mate = isCheckmate(nextTurn, this.pieces);
            const log = formatMoveLog(piece, from, to, this.pieces, check, mate, undefined, to === "g1" || to === "g8" ? "O-O" : "O-O-O");

            if (mate) {
                this.result = this.turn === "white" ? "white_win" : "black_win";
            } else if (isStalemate(nextTurn, this.pieces) || isInsufficientMaterial(this.pieces)) {
                this.result = "draw";
            }
            this.logs.push(log);
            this.turn = this.turn === "white" ? "black" : "white";
            return { success: true, log };
        }

        const target = this.pieces.find(p => p.position === to);
        const isCapture = !!target;

        // 앙파상
        if (piece.type === "pawn" && to === this.enPassantTarget) {
            const rank = piece.color === "white" ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
            const captured = `${to[0]}${rank}`;
            this.pieces = this.pieces.filter(p => p.position !== from && p.position !== captured);
        } else {
            this.pieces = this.pieces.filter(p => p.position !== from && p.position !== to);
        }

        // 프로모션
        const promoted = (piece.type === "pawn" && (to[1] === "8" || to[1] === "1"))
            ? promote(piece, "queen") // TODO: 사용자 선택으로 변경
            : { ...piece };

        promoted.position = to;
        this.pieces.push(promoted);

        // 앙파상 조건 감지
        if (piece.type === "pawn" && Math.abs(parseInt(from[1]) - parseInt(to[1])) === 2) {
            const mid = (parseInt(from[1]) + parseInt(to[1])) / 2;
            this.enPassantTarget = `${from[0]}${mid}`;
        } else {
            this.enPassantTarget = null;
        }

        this.moved[from] = true;

        // 체크/메이트/무승부 감지
        const nextTurn = this.turn === "white" ? "black" : "white";
        const board = this.pieces;

        const check = isKingInCheck(nextTurn, board);
        const mate = isCheckmate(nextTurn, board);
        const draw = isStalemate(nextTurn, board) || isInsufficientMaterial(board);
        const log = formatMoveLog(piece, from, to, board, check, mate);

        this.logs.push(log);

        if (mate) {
            this.result = this.turn === "white" ? "white_win" : "black_win";
        } else if (isStalemate(nextTurn, this.pieces) || isInsufficientMaterial(this.pieces)) {
            this.result = "draw";
        }

        this.turn = nextTurn;

        return { success: true, log };
    }
}
