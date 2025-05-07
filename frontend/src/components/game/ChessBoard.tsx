import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Piece 타입 정의: 체스 기물 하나를 나타냄
interface Piece {
    type: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
    color: "white" | "black";
    position: string; // 위치: 예) "e4"
}

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
    ...[...Array(8)].map(
        (_, i) =>
        ({
            type: "pawn",
            color: "white",
            position: String.fromCharCode(97 + i) + "2",
        } as Piece)
    ),

    // 흑 진영
    { type: "rook", color: "black", position: "a8" },
    { type: "knight", color: "black", position: "b8" },
    { type: "bishop", color: "black", position: "c8" },
    { type: "queen", color: "black", position: "d8" },
    { type: "king", color: "black", position: "e8" },
    { type: "bishop", color: "black", position: "f8" },
    { type: "knight", color: "black", position: "g8" },
    { type: "rook", color: "black", position: "h8" },
    ...[...Array(8)].map(
        (_, i) =>
        ({
            type: "pawn",
            color: "black",
            position: String.fromCharCode(97 + i) + "7",
        } as Piece)
    ),
];

const squareSize = 60; // 하나의 정사각형 칸 픽셀 크기

// 체스 좌표를 x/y 픽셀 좌표로 변환하는 함수 (isFlipped: 아래가 내 진영인지 여부)
const positionToCoords = (pos: string, flipped = false) => {
    const file = pos.charCodeAt(0) - "a".charCodeAt(0);
    const rank = parseInt(pos[1]) - 1;
    return {
        x: flipped ? (7 - file) * squareSize : file * squareSize,
        y: flipped ? rank * squareSize : (7 - rank) * squareSize,
    };
};

const coordsToPosition = (file: number, rank: number, flipped = false): string => {
    const f = flipped ? 7 - file : file;
    const r = flipped ? rank + 1 : 8 - rank;
    return String.fromCharCode("a".charCodeAt(0) + f) + r.toString();
};

const pieceIcons: Record<"white" | "black", Record<Piece["type"], string>> = {
    white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙",
    },
    black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟",
    },
};

// 유효한 이동인지 확인하는 간단한 룰
const isValidMove = (from: string, to: string, type: Piece["type"], color: Piece["color"]): boolean => {
    const dx = to.charCodeAt(0) - from.charCodeAt(0);
    const dy = parseInt(to[1]) - parseInt(from[1]);

    switch (type) {
        case "pawn": {
            const direction = color === "white" ? 1 : -1;
            const startRank = color === "white" ? 2 : 7;
            return (
                (dx === 0 && dy === direction) ||
                (dx === 0 && dy === 2 * direction && parseInt(from[1]) === startRank)
            );
        }
        case "rook": return dx === 0 || dy === 0;
        case "bishop": return Math.abs(dx) === Math.abs(dy);
        case "queen": return dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
        case "king": return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
        case "knight": return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);
        default: return false;
    }
};

// 체스보드 컴포넌트
const ChessBoard = ({ isFlipped = false }: { isFlipped?: boolean }) => {
    const [pieces, setPieces] = useState<Piece[]>(initialBoard);
    const [selectedPos, setSelectedPos] = useState<string | null>(null);

    const handleSquareClick = (pos: string) => {
        if (!selectedPos) {
            const piece = pieces.find((p) => p.position === pos);
            if (piece) setSelectedPos(pos);
        } else {
            if (selectedPos === pos) {
                setSelectedPos(null);
            } else {
                const selectedPiece = pieces.find((p) => p.position === selectedPos);
                if (selectedPiece && isValidMove(selectedPos, pos, selectedPiece.type, selectedPiece.color)) {
                    const updated = pieces
                        .filter((p) => p.position !== pos)
                        .map((p) =>
                            p.position === selectedPos ? { ...p, position: pos } : p
                        );
                    setPieces(updated);
                }
                setSelectedPos(null);
            }
        }
    };

    return (
        <div
            className="relative"
            style={{ width: squareSize * 8, height: squareSize * 8 }}
        >
            {[...Array(8)].map((_, rank) =>
                [...Array(8)].map((_, file) => {
                    const drawRank = isFlipped ? rank : 7 - rank;
                    const drawFile = isFlipped ? 7 - file : file;
                    const isDark = (drawRank + drawFile) % 2 === 1;
                    const pos = coordsToPosition(file, rank, isFlipped);
                    const isSelected = pos === selectedPos;

                    return (
                        <div
                            key={`${file}-${rank}`}
                            onClick={() => handleSquareClick(pos)}
                            className={`absolute w-[60px] h-[60px] cursor-pointer border ${isDark ? "bg-green-700" : "bg-green-200"} ${isSelected ? "border-yellow-400" : "border-transparent"
                                }`}
                            style={{
                                top: rank * squareSize,
                                left: file * squareSize,
                            }}
                        />
                    );
                })
            )}

            {/* 기물 렌더링 */}
            {pieces.map((piece, i) => {
                const { x, y } = positionToCoords(piece.position, isFlipped);
                const isKnight = piece.type === "knight";

                return (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{ x, y }}
                        transition={{
                            type: isKnight ? "spring" : "tween",
                            duration: isKnight ? 0.4 : 0.3,
                            ease: "easeInOut",
                        }}
                        className={`absolute w-[60px] h-[60px] flex items-center justify-center text-xl ${piece.color === "black" ? "text-black" : "text-white"}`}
                        style={{ pointerEvents: "none" }}
                    >
                        {pieceIcons[piece.color][piece.type]}
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ChessBoard;
