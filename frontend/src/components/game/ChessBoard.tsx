import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { Piece } from "../../types/piece";
import * as ChessRules from "./ChessRules";
import { useNavigate } from "react-router-dom";
import IngameAlertModal from "./IngameAlertModal";
import EmotionOverlay from "../game/EmotionOverlay";

// const squareSize = 60; // 하나의 정사각형 칸 픽셀 크기
const pieceIcons: Record<"white" | "black", Record<Piece["type"], string>> = {
    white: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟",
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

// 체스보드 컴포넌트
const ChessBoard = ({
    isFlipped = false,
    turnResult,
    myColor,
    gameId,
    socket,
    gameOver,
    userSkinId,
    opponentSkinId }:
    {
        isFlipped?: boolean,
        turnResult?: any;
        myColor: "white" | "black";
        gameId: string;
        socket: WebSocket | null
        gameOver?: {
            result: 'white_win' | 'black_win' | 'draw';
            winner?: 'white' | 'black';
        } | null;
        userSkinId: any;
        opponentSkinId: any;
    }) => {

    // 상태 정의 시작 --
    const [pieces, setPieces] = useState<Piece[]>(ChessRules.initialBoard);
    const [selectedPos, setSelectedPos] = useState<string | null>(null);
    const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
    const [captureSquares, setCaptureSquares] = useState<string[]>([]);

    // 특수룰 상태 정의
    const [promotionTarget, setPromotionTarget] = useState<Piece | null>(null);
    const [promotionSource, setPromotionSource] = useState<string | null>(null);
    const [movedPieces, setMovedPieces] = useState<{ [pos: string]: boolean }>({});
    const [enPassantTarget, setEnPassantTarget] = useState<string | null>(null); // 잡을 수 있는 폰의 위치

    // 턴 상태 정의
    const [turn, setTurn] = useState<"white" | "black">("white");

    // 기타 인스턴스
    const navigate = useNavigate();

    // 연출용 변수 (애니메이션)
    const [animatedFrom, setAnimatedFrom] = useState<string | null>(null);
    const [animatedTo, setAnimatedTo] = useState<string | null>(null);

    const boardRef = useRef<HTMLDivElement>(null);
    const [squareSize, setSquareSize] = useState(60);

    useLayoutEffect(() => {
        function updateSize() {
            if (boardRef.current) {
                const w = boardRef.current.clientWidth;
                setSquareSize(w / 8);
            }
        }
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // 체스 좌표를 x/y 픽셀 좌표로 변환하는 함수 (isFlipped: 아래가 내 진영인지 여부)
    function positionToCoords(pos: string, flipped = false) {
        const fileIdx = pos.charCodeAt(0) - 97        // 0 ~ 7
        const rankIdx = parseInt(pos[1]) - 1          // 0 ~ 7

        const f = flipped ? 7 - fileIdx : fileIdx;
        const r = flipped ? rankIdx : 7 - rankIdx;

        return {
            x: f * squareSize,
            y: r * squareSize,
        }
    }

    // 공통 helper: socket 이 준비되었는지 검사
    function canSendTurn(socket: WebSocket | null): socket is WebSocket {
        if (!socket) {
            console.warn("⚠️ socket 객체가 없습니다.");
            return false;
        }
        if (socket.readyState !== WebSocket.OPEN) {
            console.warn("⚠️ socket.readyState 가 OPEN 이 아닙니다:", socket.readyState);
            return false;
        }
        return true;
    }

    // 체크메이트 테스트 코드
    // useEffect(() => {
    //     setPieces([
    //         // 🟥 흑 킹 - 구석에 몰려있음
    //         { type: "king", color: "black", position: "e8" },

    //         // ✅ 체크 유발용 흰색 킹
    //         { type: "king", color: "white", position: "e1" },

    //         // 🧱 흑 기물들 - 도망갈 길 차단
    //         { type: "rook", color: "black", position: "a8" },
    //         { type: "rook", color: "black", position: "h8" },
    //         { type: "rook", color: "white", position: "b1" },
    //     ]);
    //     setTurn("white"); // 흑이 먼저 d7 → d5로 더블스텝 해야 함
    // }, []);

    useEffect(() => {
        // ✅ null이면 패스
        if (!turnResult || !turnResult.board) return;

        setPieces(turnResult.board);
        setTurn(turnResult.turn);

        const last = turnResult?.lastMove;
        if (turnResult?.lastMove?.to) {
            setAnimatedFrom(turnResult.lastMove.from);
            setAnimatedTo(turnResult.lastMove.to);
        }

        const timer = setTimeout(() => {
            setAnimatedFrom(null);
            setAnimatedTo(null);
        }, (turnResult.lastMove.pieceType === "knight" ? 0.4 : 0.3) * 1000);

        if (!last) {
            setEnPassantTarget(null);
            return;
        }

        const { pieceType, from, to } = last;

        // pawn이 두 칸 점프했을 때만 앙파상 체크
        if (pieceType === "pawn" && Math.abs(+from[1] - +to[1]) === 2) {
            // 예: from="e7" to="e5" → target은 "e6"
            const file = to[0];
            const rank = (+from[1] + +to[1]) / 2;
            setEnPassantTarget(`${file}${rank}`);
        } else {
            setEnPassantTarget(null);
        }

        // 턴이 바뀔 때마다 (화이트→블랙, 블랙→화이트) 선택/하이라이트 초기화
        setSelectedPos(null);
        setHighlightSquares([]);
        setCaptureSquares([]);

        return () => clearTimeout(timer);
    }, [turnResult])

    const handleSquareClick = (pos: string) => {
        console.log("▶️ handleSquareClick", { pos, myColor, turn, socketState: socket?.readyState });

        if (gameOver) {
            // 게임 종료 후 클릭 무시
            return;
        }

        if (myColor !== turn) return; // 💥 상대 턴이면 클릭 무시

        if (!selectedPos) {
            const piece = pieces.find((p) => p.position === pos);
            if (piece) {
                if (piece.color !== turn) return; // 턴 아닌 기물은 무시
                setSelectedPos(pos);
                // 이동 가능한 칸 하이라이트 계산
                const possibleSquares = [...Array(8)].flatMap((_, rank) =>
                    [...Array(8)].map((_, file) => ChessRules.coordsToPosition(file, rank)).filter((to) => {
                        if (!ChessRules.isValidMove(pos, to, piece.type, piece.color, pieces, movedPieces, enPassantTarget)) {
                            return false;
                        }
                        // 🔍 시뮬레이션 이동 후 체크 감지
                        const simulatedBoard = pieces
                            .filter((p) => p.position !== pos && p.position !== to)
                            .concat({ ...piece, position: to });

                        return !ChessRules.isKingInCheck(piece.color, simulatedBoard);
                    }
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
                if (selectedPiece && ChessRules.isValidMove(selectedPos, pos, selectedPiece.type, selectedPiece.color, pieces, movedPieces, enPassantTarget)) {
                    // 👇 시뮬레이션 보드 구성
                    const simulatedBoard2 = pieces
                        .filter((p) => p.position !== pos && p.position !== selectedPos)
                        .concat({ ...selectedPiece, position: pos });

                    // 👇 자기 킹이 위협당하면 이동 불가
                    if (ChessRules.isKingInCheck(selectedPiece.color, simulatedBoard2)) return;

                    // 🔥 캐슬링 체크
                    const castling = ChessRules.isCastlingMove(
                        selectedPos,
                        pos,
                        selectedPiece.type,
                        selectedPiece.color,
                        pieces,
                        movedPieces
                    );

                    if (castling) {

                        const simulatedBoard = pieces.map(p => {
                            if (p.position === selectedPos) return { ...p, position: pos }; // 킹 이동
                            if (p.position === castling.rookFrom) return { ...p, position: castling.rookTo }; // 룩 이동
                            return p;
                        });

                        const nextTurn = turn === "white" ? "black" : "white";
                        if (ChessRules.isKingInCheck(nextTurn, simulatedBoard)) {
                            console.log("🟥 체크입니다!");
                        }
                        if (ChessRules.isCheckmate(nextTurn, simulatedBoard)) {
                            console.log("🏁 캐슬링으로 체크메이트!");
                        }
                        if (ChessRules.isStalemate(nextTurn, simulatedBoard)) {
                            console.log("🤝 캐슬링 스테일메이트 (무승부)");
                        }


                        setPieces(simulatedBoard);
                        setMovedPieces(prev => ({
                            ...prev,
                            [selectedPos]: true,
                            [castling.rookFrom]: true,
                        }));
                        setSelectedPos(null);
                        setHighlightSquares([]);
                        setCaptureSquares([]);
                        console.log("턴무브 보낼게요요요");
                        if (canSendTurn(socket)) {
                            console.log("턴무브 보낸다잉??");
                            socket.send(JSON.stringify({
                                type: "TURN_MOVE",
                                gameId,
                                from: selectedPos,
                                to: pos,
                            }));
                        }
                        setTurn(prev => (prev === "white" ? "black" : "white"));
                    }

                    // 🪓 앙파상
                    const isEnPassantCapture =
                        selectedPiece.type === "pawn" && pos === enPassantTarget;

                    if (isEnPassantCapture) {
                        const captureRank =
                            selectedPiece.color === "white"
                                ? parseInt(pos[1]) - 1
                                : parseInt(pos[1]) + 1;
                        const capturedPos = `${pos[0]}${captureRank}`;

                        // ✅ 체크 감지
                        const simulatedBoard = pieces
                            .filter(p => p.position !== pos && p.position !== selectedPos)
                            .concat({ ...selectedPiece, position: pos });

                        const nextTurn = turn === "white" ? "black" : "white";
                        if (ChessRules.isKingInCheck(nextTurn, simulatedBoard)) {
                            console.log("🟥 앙파상 체크입니다!");
                        }
                        if (ChessRules.isCheckmate(nextTurn, simulatedBoard)) {
                            console.log("🏁 앙파상 체크메이트입니다!");
                            // 👉 이후: 모달 띄우거나 게임 종료 처리
                        }
                        if (ChessRules.isStalemate(nextTurn, simulatedBoard)) {
                            console.log("🤝 앙파상 스테일메이트입니다 (무승부)");
                        }

                        setPieces(prev =>
                            prev
                                .filter(p => p.position !== capturedPos && p.position !== selectedPos)
                                .concat({ ...selectedPiece, position: pos })
                        );
                        setSelectedPos(null);
                        setHighlightSquares([]);
                        setCaptureSquares([]);
                        setEnPassantTarget(null);
                        setMovedPieces(prev => ({
                            ...prev,
                            [selectedPos]: true,
                        }));
                        console.log("턴무브 보낼게요요요");
                        if (canSendTurn(socket)) {
                            console.log("턴무브 보낸다잉??");
                            socket.send(JSON.stringify({
                                type: "TURN_MOVE",
                                gameId,
                                from: selectedPos,
                                to: pos,
                            }));
                            return;
                        }
                        setTurn(prev => (prev === "white" ? "black" : "white"));
                    }


                    const movedPiece = { ...selectedPiece, position: pos };

                    // ✅ 이동 후 프로모션 조건 검사
                    if (ChessRules.isPromotionSquare(movedPiece)) {
                        setPromotionTarget(movedPiece); // 전체 Piece 전달
                        setPromotionSource(selectedPos);
                        setSelectedPos(null);
                        setHighlightSquares([]);
                        setCaptureSquares([]);
                        setTurn(prev => (prev === "white" ? "black" : "white"));
                        return;
                    }

                    // ♟️ 일반 이동
                    const isPawnDoubleStep =
                        selectedPiece.type === "pawn" &&
                        Math.abs(parseInt(pos[1]) - parseInt(selectedPos[1])) === 2;

                    if (isPawnDoubleStep) {
                        const file = pos[0];
                        const midRank =
                            selectedPiece.color === "white"
                                ? parseInt(selectedPos[1]) + 1
                                : parseInt(selectedPos[1]) - 1;
                        setEnPassantTarget(`${file}${midRank}`);
                    } else {
                        setEnPassantTarget(null);
                    }

                    const updated = pieces
                        .filter((p) => p.position !== pos)
                        .map((p) =>
                            p.position === selectedPos ? { ...p, position: pos } : p
                        );
                    setPieces(updated);
                    setMovedPieces(prev => ({
                        ...prev,
                        [selectedPos]: true,
                    }));

                    // ✅ 체크 감지
                    const simulatedBoard = pieces
                        .filter(p => p.position !== pos && p.position !== selectedPos)
                        .concat({ ...selectedPiece, position: pos });

                    const nextTurn = turn === "white" ? "black" : "white";
                    if (ChessRules.isKingInCheck(nextTurn, simulatedBoard)) {
                        console.log("🟥 일반 이동 체크입니다!");
                    }

                    if (ChessRules.isCheckmate(nextTurn, simulatedBoard)) {
                        console.log("🏁 일반 이동 체크메이트입니다!");
                        // 👉 이후: 모달 띄우거나 게임 종료 처리
                    }
                    if (ChessRules.isStalemate(nextTurn, simulatedBoard)) {
                        console.log("🤝 일반 이동 스테일메이트입니다 (무승부)");
                    }
                    if (ChessRules.isInsufficientMaterial(simulatedBoard)) {
                        console.log("🤝 기물 부족 무승부 (킹만 남음)");
                    }
                    console.log("턴무브 보낼게요요요");

                    if (canSendTurn(socket)) {
                        console.log("턴무브 보낸다잉??");
                        socket.send(JSON.stringify({
                            type: "TURN_MOVE",
                            gameId,
                            from: selectedPos,
                            to: pos,
                        }));
                        console.log("턴무브 보냈따이");
                    }
                    setTurn(prev => (prev === "white" ? "black" : "white"));
                }
                setSelectedPos(null);
                setHighlightSquares([]);
                setCaptureSquares([]);
            }
        }
    };

    return (
        <>
            <div className="relative z-20 max-w-full max-h-full w-full h-full">
                {/* 좌표 표시 */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block coordinate_container">
                    {/* 왼쪽: 숫자 (랭크) */}
                    {[...Array(8)].map((_, i) => {
                        const rank = isFlipped ? i + 1 : 8 - i;
                        return (
                            <div
                                key={`rank-${i}`}
                                className="absolute left-[-20px] text-xs text-white coordinate_rank"
                                style={{ top: i * squareSize + 20 }}
                            >
                                {rank}
                            </div>
                        );
                    })}

                    {/* 아래쪽: 알파벳 (파일) */}
                    {[...Array(8)].map((_, i) => {
                        const fileIdx = isFlipped ? 7 - i : i;
                        const file = String.fromCharCode("a".charCodeAt(0) + fileIdx);

                        return (
                            <div
                                key={`file-${i}`}
                                className="absolute bottom-[-18px] text-xs text-white coordinate_file"
                                style={{ left: i * squareSize + 20 }}
                            >
                                {file}
                            </div>
                        );
                    })}
                </div>

                {/* !!! 체스판 렌더 !!! */}
                <div
                    ref={boardRef}
                    className="chessboard relative mx-auto w-full mx-0 md:w-[90vmin] md:mx-auto max-w-fullaspect-square"
                    style={{ backgroundColor: "red" }}
                >
                    {[...Array(8)].map((_, rank) =>
                        [...Array(8)].map((_, file) => {
                            const drawRank = isFlipped ? rank : 7 - rank;
                            const drawFile = file;
                            const isDark = (drawRank + drawFile) % 2 === 1;
                            const pos = ChessRules.coordsToPosition(file, rank, isFlipped);
                            const isSelected = pos === selectedPos;
                            const isHighlighted = highlightSquares.includes(pos);
                            const isCapture = captureSquares.includes(pos);
                            // console.log("squareSize: ", squareSize);

                            // 실제 rank, file 문자열
                            const rankLabel = isFlipped ? rank + 1 : 8 - rank;
                            const fileLabel = String.fromCharCode("a".charCodeAt(0) + (isFlipped ? 7 - file : file));

                            // 경계 체크
                            const isEdgeFile = file === 0
                            const isEdgeRank = rank === 7

                            return (
                                <div
                                    key={`${file}-${rank}`}
                                    onClick={() => {
                                        handleSquareClick(pos);
                                    }}
                                    // className={`absolute w-[60px] h-[60px] cursor-pointer border 
                                    // ${isDark ? "bg-green-700" : "bg-green-200"} 
                                    // ${isSelected ? "border-yellow-400"
                                    //         : isCapture ? "border-red-500 border-2" : isHighlighted ? "border-blue-400 border-2" : "border-transparent"
                                    //     }`}
                                    className={`
                                            absolute
                                            cursor-pointer border
                                            ${((drawRank + drawFile) % 2) === 1 ? 'bg-green-700' : 'bg-green-200'}
                                            ${pos === selectedPos ? 'border-yellow-400 border-2'
                                            : captureSquares.includes(pos) ? 'border-red-500 border-2'
                                                : highlightSquares.includes(pos) ? 'border-blue-400 border-2'
                                                    : 'border-transparent'}
        `}
                                    style={{
                                        width: squareSize,
                                        height: squareSize,
                                        top: rank * squareSize,
                                        left: drawFile * squareSize,
                                    }}
                                >
                                    {isEdgeFile && (
                                        <span className="absolute top-1 left-1 text-[10px] text-white block md:hidden">
                                            {rankLabel}
                                        </span>
                                    )}
                                    {isEdgeRank && (
                                        <span className="absolute bottom-1 right-1 text-[10px] text-white block md:hidden">
                                            {fileLabel}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* 기물 렌더링 */}
                    {pieces.map((piece, i) => {
                        const toCoords = positionToCoords(piece.position, isFlipped);
                        const fromCoords = animatedFrom
                            ? positionToCoords(animatedFrom, isFlipped)
                            : toCoords;
                        const { x, y } = positionToCoords(piece.position, isFlipped);
                        const isKnight = piece.type === "knight";
                        const isMovedPiece = animatedTo === piece.position;
                        const duration = isMovedPiece ? (isKnight ? 0.4 : 0.3) : 0;

                        return isMovedPiece
                            ? (
                                <motion.div
                                    key={piece.position}
                                    initial={{ x: fromCoords.x, y: fromCoords.y }}
                                    animate={{ x: toCoords.x, y: toCoords.y }}
                                    transition={{ type: isKnight ? "spring" : "tween", duration }}
                                    className={`absolute w-[60px] h-[60px] flex items-center justify-center text-5xl text-${piece.color}`}
                                    style={{ pointerEvents: "none" }}
                                >
                                    {pieceIcons[piece.color][piece.type]}
                                </motion.div>
                            ) : (
                                <div
                                    key={i}
                                    className={`absolute w-[60px] h-[60px] flex items-center justify-center text-5xl text-${piece.color}`}
                                    style={{ left: x, top: y, pointerEvents: "none" }}
                                >
                                    {pieceIcons[piece.color][piece.type]}
                                </div>
                            );
                    })}

                    {/*게임 종료 모달*/}
                    <>
                        <IngameAlertModal
                            isOpen={!!gameOver}
                            title={
                                gameOver?.result === 'draw'
                                    ? '무승부!'
                                    : gameOver?.winner === myColor
                                        ? '승리!'
                                        : '패배…'
                            }
                            message={
                                gameOver?.result === 'draw'
                                    ? '두 플레이어가 무승부를 기록했습니다.'
                                    : gameOver?.winner === myColor
                                        ? '축하합니다! 승리하셨습니다.'
                                        : '아쉽지만 다음 기회를 노려보세요.'
                            }
                            confirmText="로비로"
                            onConfirm={() => navigate('/main')}
                        />
                    </>

                    {/* 프로모션 모달 */}
                    {promotionTarget && (
                        <PromotionModal
                            color={promotionTarget.color}
                            onSelect={(type) => {
                                const promoted = ChessRules.promote(promotionTarget, type);
                                const nextTurn = promotionTarget.color === "white" ? "black" : "white";

                                const simulatedBoard = pieces
                                    .filter(p => ![promotionTarget.position, promotionSource].includes(p.position))
                                    .concat(promoted);

                                if (ChessRules.isKingInCheck(nextTurn, simulatedBoard)) {
                                    console.log("🟥 프로모션 체크입니다!");
                                }
                                if (ChessRules.isCheckmate(nextTurn, simulatedBoard)) {
                                    console.log("🏁 프로모션 체크메이트입니다!");
                                }
                                if (ChessRules.isStalemate(nextTurn, simulatedBoard)) {
                                    console.log("🤝 프로모션 스테일메이트입니다 (무승부)");
                                }

                                setPieces(simulatedBoard);
                                setPromotionTarget(null);
                                setPromotionSource(null);
                                console.log("턴무브 보낼게요요요");

                                if (canSendTurn(socket)) {
                                    console.log("턴무브 보낸다잉??");
                                    socket.send(JSON.stringify({
                                        type: "TURN_MOVE",
                                        gameId,
                                        from: promotionSource!,
                                        to: promotionTarget.position,
                                    }));
                                }
                                setTurn(nextTurn);
                            }}
                        />
                    )}
                </div>
            </div>

            {/** ———————————— 감정 연출 ———————————— **/}
            {/* 내 쪽(우측)에 내 감정 */}
            <EmotionOverlay
                pieces={pieces}
                characterColor={myColor}
                skinId={userSkinId}
                side="left"
            />
            {/* 상대 쪽(좌측)에 상대 감정, 좌우 반전 적용 */}
            <EmotionOverlay
                pieces={pieces}
                characterColor={myColor === "white" ? "black" : "white"}
                skinId={opponentSkinId}
                side="right"
            />
        </>
    );

};

export { ChessBoard, PromotionModal };
