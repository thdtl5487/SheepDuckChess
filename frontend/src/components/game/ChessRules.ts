import { Piece } from "../../types/piece";


const coordsToPosition = (file: number, rank: number, flipped = false): string => {
    const f = flipped ? 7 - file : file
    const r = flipped ? rank : 7 - rank
    return String.fromCharCode(97 + f) + String(r + 1)
};

// 초기 체스 기물 전체 배치
const initialBoard: Piece[] = [
    // 백 진영
    { type: "rook", color: "white", position: "a1" },
    { type: "knight", color: "white", position: "b1" },
    { type: "bishop", color: "white", position: "c1" },
    { type: "queen", color: "white", position: "d1" },
    { type: "king", color: "white", position: "e1" },
    { type: "bishop", color: "white", position: "f1" },
    { type: "knight", color: "white", position: "g1" },
    { type: "rook", color: "white", position: "h1" },
    ...[...Array(8)].map((_, i) => ({ type: "pawn", color: "white", position: String.fromCharCode(97 + i) + "2" } as Piece)),

    // 흑 진영
    { type: "rook", color: "black", position: "a8" },
    { type: "knight", color: "black", position: "b8" },
    { type: "bishop", color: "black", position: "c8" },
    { type: "queen", color: "black", position: "d8" },
    { type: "king", color: "black", position: "e8" },
    { type: "bishop", color: "black", position: "f8" },
    { type: "knight", color: "black", position: "g8" },
    { type: "rook", color: "black", position: "h8" },
    ...[...Array(8)].map((_, i) => ({ type: "pawn", color: "black", position: String.fromCharCode(97 + i) + "7" } as Piece)),
];

// 유효한 이동인지 확인하는 간단한 룰 (폰 공격, 캐슬링, 앙파상, 프로모션 일부 반영)
const isValidMove = (
    from: string,
    to: string,
    type: Piece["type"],
    color: Piece["color"],
    board: Piece[],
    moved: { [pos: string]: boolean },
    enPassantTarget: string | null
): boolean => {
    const dx = to.charCodeAt(0) - from.charCodeAt(0);
    const dy = parseInt(to[1]) - parseInt(from[1]);

    const targetPiece = board.find((p) => p.position === to);
    if (targetPiece && targetPiece.color === color) return false; // 모든 기물 공통


    // 앙파상 허용
    if (
        type === "pawn" &&
        enPassantTarget === to &&
        Math.abs(dx) === 1 &&
        dy === (color === "white" ? 1 : -1)
    ) {
        return true;
    }

    const isEnemy = (pos: string) => {
        const target = board.find((p) => p.position === pos);
        return !!target && target.color !== color;
    };

    // ✅ 캐슬링 허용 처리
    if (type === "king") {
        const castling = isCastlingMove(from, to, type, color, board, moved);
        if (castling) return true;
    }

    switch (type) {
        case "pawn": {
            const direction = color === "white" ? 1 : -1;
            const startRank = color === "white" ? 2 : 7;
            const targetPiece = board.find(p => p.position === to);

            if (dx === 0 && dy === direction && !targetPiece) return true;
            if (dx === 0 && dy === 2 * direction && parseInt(from[1]) === startRank && !targetPiece) {
                const intermediate = from[0] + (parseInt(from[1]) + direction);
                return !board.find(p => p.position === intermediate);
            }

            if (Math.abs(dx) === 1 && dy === direction) return isEnemy(to);
            return false;
        }
        case "rook":
            return (dx === 0 || dy === 0) && isPathClear(from, to, board);
        case "bishop":
            return Math.abs(dx) === Math.abs(dy) && isPathClear(from, to, board);
        case "queen":
            return (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && isPathClear(from, to, board);
        case "king": return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
        case "knight": return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);
        default: return false;
    }
};
// 프로모션 처리: 선택창을 띄우기 위한 도달 판별만
const isPromotionSquare = (piece: Piece): boolean => {
    if (piece.type !== "pawn") return false;
    const lastRank = piece.color === "white" ? "8" : "1";
    return piece.position[1] === lastRank;
};

// 실제 승격은 외부에서 사용자가 선택한 기물로 type을 교체해야 함
const promote = (piece: Piece, to: Piece["type"]): Piece => {
    const validTypes: Piece["type"][] = ["queen", "rook", "bishop", "knight"];
    if (!validTypes.includes(to)) throw new Error("Invalid promotion piece type");
    return { ...piece, type: to }; // 기존 color와 position 유지
};

// 캐슬링 이동 관련 기능
const isCastlingMove = (
    from: string,
    to: string,
    type: Piece["type"],
    color: Piece["color"],
    board: Piece[],
    moved: { [pos: string]: boolean }
): { rookFrom: string; rookTo: string } | null => {
    if (type !== "king") return null;
    const rank = color === "white" ? "1" : "8";
    if (from !== `e${rank}`) return null;

    // 캐슬링 시도일 때만(목적지가 g/c 파일일 때만) 체크 상태 금지 검사
    if (to === `g${rank}` || to === `c${rank}`) {
        if (isKingInCheck(color, board)) return null;
    }

    const isPathAttacked = (squares: string[]): boolean =>
        squares.some(square => {
            const simulated = board.map(p =>
                p.position === from ? { ...p, position: square } : p
            );
            return isKingInCheck(color, simulated);
        });

    // 🏰 킹사이드
    if (to === `g${rank}`) {
        if (
            !moved[`e${rank}`] &&
            !moved[`h${rank}`] &&
            !board.find((p) => p.position === `f${rank}` || p.position === `g${rank}`) &&
            !isPathAttacked([`f${rank}`, `g${rank}`])
        ) {
            return { rookFrom: `h${rank}`, rookTo: `f${rank}` };
        }
    }

    // 🏰 퀸사이드
    if (to === `c${rank}`) {
        if (
            !moved[`e${rank}`] &&
            !moved[`a${rank}`] &&
            !board.find((p) => p.position === `b${rank}` || p.position === `c${rank}` || p.position === `d${rank}`) &&
            !isPathAttacked([`d${rank}`, `c${rank}`])
        ) {
            return { rookFrom: `a${rank}`, rookTo: `d${rank}` };
        }
    }

    return null;
};

// 체크 감지
function isKingInCheck(color: "white" | "black", board: Piece[]): boolean {
    const opponentColor = color === "white" ? "black" : "white";

    const king = board.find(
        (p) => p.type === "king" && p.color === color
    );
    if (!king) return false;

    const kingPos = king.position;

    for (const piece of board) {
        if (piece.color !== opponentColor) continue;

        if (
            isValidMove(
                piece.position,
                kingPos,
                piece.type,
                piece.color,
                board,
                {},
                null
            )
        ) {
            return true;
        }
    }

    return false;
}

// 체크메이트 감지
function simulateAfterMove(params: {
    board: Piece[];
    piece: Piece;
    from: string;
    to: string;
    moved: { [pos: string]: boolean };
    enPassantTarget: string | null;
}): Piece[] {
    const { board, piece, from, to, moved, enPassantTarget } = params;

    const castling = isCastlingMove(from, to, piece.type, piece.color, board, moved);
    if (castling) {
        const rook = board.find(p => p.position === castling.rookFrom);
        const next = board
            .filter(p => p.position !== from && p.position !== castling.rookFrom)
            .concat({ ...piece, position: to });
        return rook ? next.concat({ ...rook, position: castling.rookTo }) : next;
    }

    const isEnPassant = piece.type === "pawn" && enPassantTarget === to && Math.abs(to.charCodeAt(0) - from.charCodeAt(0)) === 1;
    const capturedEnPassantPos = (() => {
        if (!isEnPassant) return null;
        const rank = piece.color === "white" ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
        return `${to[0]}${rank}`;
    })();

    return board
        .filter(p => p.position !== from && p.position !== to && (!capturedEnPassantPos || p.position !== capturedEnPassantPos))
        .concat({ ...piece, position: to });
}

function isCheckmate(
    color: "white" | "black",
    board: Piece[],
    moved: { [pos: string]: boolean } = {},
    enPassantTarget: string | null = null
): boolean {
    if (!isKingInCheck(color, board)) return false;

    const piecesOfColor = board.filter(p => p.color === color);

    for (const piece of piecesOfColor) {
        for (let file = 0; file < 8; file++) {
            for (let rank = 0; rank < 8; rank++) {
                const to = coordsToPosition(file, rank);
                if (
                    isValidMove(piece.position, to, piece.type, piece.color, board, moved, enPassantTarget)
                ) {
                    const simulated = simulateAfterMove({
                        board,
                        piece,
                        from: piece.position,
                        to,
                        moved,
                        enPassantTarget,
                    });

                    if (!isKingInCheck(color, simulated)) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

// 스테일메이트 감지
function isStalemate(
    color: "white" | "black",
    board: Piece[],
    moved: { [pos: string]: boolean } = {},
    enPassantTarget: string | null = null
): boolean {
    if (isKingInCheck(color, board)) return false;

    const piecesOfColor = board.filter(p => p.color === color);

    for (const piece of piecesOfColor) {
        for (let file = 0; file < 8; file++) {
            for (let rank = 0; rank < 8; rank++) {
                const to = coordsToPosition(file, rank);

                if (to === piece.position) continue;

                if (
                    isValidMove(piece.position, to, piece.type, piece.color, board, moved, enPassantTarget)
                ) {
                    const simulated = simulateAfterMove({
                        board,
                        piece,
                        from: piece.position,
                        to,
                        moved,
                        enPassantTarget,
                    });

                    const isInCheck = isKingInCheck(color, simulated);

                    if (!isInCheck) {
                        return false; // 하나라도 합법 수가 있으면 스테일메이트 아님
                    }
                }
            }
        }
    }
    return true;
}

// 기물 부족 무승부 감지
function isInsufficientMaterial(board: Piece[]): boolean {
    const white = board.filter(p => p.color === "white");
    const black = board.filter(p => p.color === "black");

    const isKingOnly = (pieces: Piece[]) => pieces.length === 1 && pieces[0].type === "king";

    const isKingAndMinor = (pieces: Piece[]) =>
        pieces.length === 2 &&
        pieces.some(p => p.type === "king") &&
        pieces.some(p => p.type === "bishop" || p.type === "knight");

    return (
        (isKingOnly(white) && isKingOnly(black)) ||              // 킹 vs 킹
        (isKingAndMinor(white) && isKingOnly(black)) ||          // 킹+비숍/나이트 vs 킹
        (isKingAndMinor(black) && isKingOnly(white))             // 킹 vs 킹+비숍/나이트
    );
}

// 기물 경로 확인용 기능
const isPathClear = (from: string, to: string, board: Piece[]): boolean => {
    const fileDiff = to.charCodeAt(0) - from.charCodeAt(0);
    const rankDiff = parseInt(to[1]) - parseInt(from[1]);

    const fileStep = Math.sign(fileDiff);
    const rankStep = Math.sign(rankDiff);

    const steps = Math.max(Math.abs(fileDiff), Math.abs(rankDiff));
    if (steps <= 1) return true; // 바로 옆은 경로 체크 생략

    for (let step = 1; step < steps; step++) {
        const file = String.fromCharCode(from.charCodeAt(0) + fileStep * step);
        const rank = (parseInt(from[1]) + rankStep * step).toString();
        const intermediate = `${file}${rank}`;
        if (board.find(p => p.position === intermediate)) return false;
    }

    return true;
};

export {
    coordsToPosition,
    isValidMove,
    isKingInCheck,
    isCheckmate,
    isStalemate,
    isPromotionSquare,
    promote,
    isCastlingMove,
    isPathClear,
    initialBoard,
    isInsufficientMaterial
};