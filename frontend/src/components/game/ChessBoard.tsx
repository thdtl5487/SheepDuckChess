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

// (생략된 코드 유지)

// 유효한 이동인지 확인하는 간단한 룰 (폰 공격, 캐슬링, 앙파상, 프로모션 일부 반영)
const isValidMove = (
    from: string,
    to: string,
    type: Piece["type"],
    color: Piece["color"],
    board: Piece[],
    moved: { [pos: string]: boolean }
): boolean => {
    const dx = to.charCodeAt(0) - from.charCodeAt(0);
    const dy = parseInt(to[1]) - parseInt(from[1]);

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
        case "rook": return dx === 0 || dy === 0;
        case "bishop": return Math.abs(dx) === Math.abs(dy);
        case "queen": return dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
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

// 프로모션 선택 모달
const PromotionModal = ({
    color,
    onSelect,
}: {
    color: "white" | "black";
    onSelect: (type: Piece["type"]) => void;
}) => {
    const options: Array<"queen" | "rook" | "bishop" | "knight"> = [
        "queen",
        "rook",
        "bishop",
        "knight",
    ];
    const iconMap: Record<
        "white" | "black",
        Record<"queen" | "rook" | "bishop" | "knight", string>
    > = {
        white: {
            queen: "♕",
            rook: "♖",
            bishop: "♗",
            knight: "♘",
        },
        black: {
            queen: "♛",
            rook: "♜",
            bishop: "♝",
            knight: "♞",
        },
    };

    const iconColorClass = color === "white" ? "text-black" : "text-white";
    const modalBgColor = "bg-gray-700"; // 어두운 회색

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div
                className={`${modalBgColor} p-4 rounded shadow-md text-center text-white`}
            >
                <p className="mb-2 font-bold">프로모션 선택</p>
                <div className="flex gap-4 justify-center">
                    {options.map((type) => (
                        <button
                            key={type}
                            onClick={() => onSelect(type)}
                            className={`text-3xl p-2 hover:bg-gray-600 rounded ${iconColorClass}`}
                        >
                            {iconMap[color][type]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
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

    // 킹사이드 캐슬링
    if (to === `g${rank}`) {
        if (
            !moved[`e${rank}`] &&
            !moved[`h${rank}`] &&
            !board.find((p) => p.position === `f${rank}` || p.position === `g${rank}`)
        ) {
            return { rookFrom: `h${rank}`, rookTo: `f${rank}` };
        }
    }

    // 퀸사이드 캐슬링
    if (to === `c${rank}`) {
        if (
            !moved[`e${rank}`] &&
            !moved[`a${rank}`] &&
            !board.find((p) => p.position === `b${rank}` || p.position === `c${rank}` || p.position === `d${rank}`)
        ) {
            return { rookFrom: `a${rank}`, rookTo: `d${rank}` };
        }
    }

    return null;
};


// 체스보드 컴포넌트
const ChessBoard = ({ isFlipped = false }: { isFlipped?: boolean }) => {
    const [pieces, setPieces] = useState<Piece[]>(initialBoard);
    const [selectedPos, setSelectedPos] = useState<string | null>(null);
    const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
    const [captureSquares, setCaptureSquares] = useState<string[]>([]);
    const [promotionTarget, setPromotionTarget] = useState<Piece | null>(null);
    const [promotionSource, setPromotionSource] = useState<string | null>(null);
    const [movedPieces, setMovedPieces] = useState<{ [pos: string]: boolean }>({});

    const handleSquareClick = (pos: string) => {

        if (!selectedPos) {
            const piece = pieces.find((p) => p.position === pos);
            if (piece) {
                setSelectedPos(pos);
                // 이동 가능한 칸 하이라이트 계산
                const possibleSquares = [...Array(8)].flatMap((_, rank) =>
                    [...Array(8)].map((_, file) => coordsToPosition(file, rank)).filter((to) =>
                        isValidMove(pos, to, piece.type, piece.color, pieces, movedPieces)
                    )
                );

                const captures = possibleSquares.filter((sq) => {
                    const target = pieces.find((p) => p.position === sq);
                    return target && target.color !== piece.color;
                });

                const normalMoves = possibleSquares.filter((sq) => !captures.includes(sq));

                setCaptureSquares(captures);
                setHighlightSquares(normalMoves);
            }
        } else {
            if (selectedPos === pos) {
                setSelectedPos(null);
                setHighlightSquares([]);
                setCaptureSquares([]);
            } else {
                const selectedPiece = pieces.find((p) => p.position === selectedPos);
                if (selectedPiece && isValidMove(selectedPos, pos, selectedPiece.type, selectedPiece.color, pieces, movedPieces)) {

                    // 🔥 캐슬링 체크
                    const castling = isCastlingMove(
                        selectedPos,
                        pos,
                        selectedPiece.type,
                        selectedPiece.color,
                        pieces,
                        movedPieces
                    );

                    if (castling) {
                        setPieces(prev => prev.map(p => {
                            if (p.position === selectedPos) return { ...p, position: pos }; // 킹 이동
                            if (p.position === castling.rookFrom) return { ...p, position: castling.rookTo }; // 룩 이동
                            return p;
                        }));
                        setMovedPieces(prev => ({
                            ...prev,
                            [selectedPos]: true,
                            [castling.rookFrom]: true,
                        }));
                        setSelectedPos(null);
                        setHighlightSquares([]);
                        setCaptureSquares([]);
                        return;
                    }

                    const movedPiece = { ...selectedPiece, position: pos };

                    // ✅ 이동 후 프로모션 조건 검사
                    if (isPromotionSquare(movedPiece)) {
                        setPromotionTarget(movedPiece); // 전체 Piece 전달
                        setPromotionSource(selectedPos);
                        setSelectedPos(null);
                        setHighlightSquares([]);
                        setCaptureSquares([]);
                        return;
                    }

                    const updated = pieces
                        .filter((p) => p.position !== pos)
                        .map((p) =>
                            p.position === selectedPos ? { ...p, position: pos } : p
                        );
                    setPieces(updated);
                }
                setSelectedPos(null);
                setHighlightSquares([]);
                setCaptureSquares([]);
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
                    const isHighlighted = highlightSquares.includes(pos);
                    const isCapture = captureSquares.includes(pos);

                    return (
                        <div
                            key={`${file}-${rank}`}
                            onClick={() => handleSquareClick(pos)}
                            className={`absolute w-[60px] h-[60px] cursor-pointer border ${isDark ? "bg-green-700" : "bg-green-200"} ${isSelected
                                ? "border-yellow-400"
                                : isCapture
                                    ? "border-red-500 border-2"
                                    : isHighlighted
                                        ? "border-blue-400 border-2"
                                        : "border-transparent"
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
                        className={`absolute w-[60px] h-[60px] flex items-center justify-center text-5xl ${piece.color === "black" ? "text-black" : "text-white"}`}
                        style={{ pointerEvents: "none" }}
                    >
                        {pieceIcons[piece.color][piece.type]}
                    </motion.div>
                );
            })}

            {/* 프로모션 모달 */}
            {promotionTarget && (
                <PromotionModal
                    color={promotionTarget.color}
                    onSelect={(type) => {
                        const promoted = promote(promotionTarget, type);
                        console.log("🧼 removing piece at", promotionTarget.position);
                        console.log("🧼 pieces map:", pieces.map(p => p.position));
                        setPieces(prev =>
                            prev
                                .filter(p =>
                                    p.position !== promotionTarget.position && // 상대 기물 제거
                                    p.position !== promotionSource             // 내 폰 제거 ← 이게 핵심!!
                                )
                                .concat(promote(promotionTarget, type))
                        );
                        setPromotionTarget(null);
                        setPromotionSource(null);
                    }}
                />
            )}
        </div>
    );
};

export { ChessBoard, isValidMove, isPromotionSquare, promote, PromotionModal };
