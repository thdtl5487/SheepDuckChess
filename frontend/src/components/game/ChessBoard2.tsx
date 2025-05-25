import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { Piece } from "../../types/piece";
import * as ChessRules from "./ChessRules";
import { useNavigate } from "react-router-dom";
import IngameAlertModal from "./IngameAlertModal";
import EmotionOverlay from "../game/EmotionOverlay";
import { SkinSetting } from "../../types/matchInfo";
import { useBoardSize } from "../../hooks/inGame/useBoardSize";
import { useTurnSender } from "../../hooks/inGame/useTurnSender";
import { boardTo2D } from "../../hooks/inGame/useEtcUtil";
import { useChessDrag } from "../../hooks/inGame/useDrag";
import { useChessMove } from "../../hooks/inGame/useChessMove";
import { PromotionModal } from "./PromotionModal";

type GameOverType = { result: string; winner: "white" | "black" | null };

const ChessBoard2 = ({
    isFlipped = false,
    turnResult,
    myColor,
    gameId,
    socket,
    gameOver,
    userSkinId,
    opponentSkinId,
    isOpponentConnected,
    pcTileSize = 64,
    mobileTileSize = 45,
    tabletTileSize = 64,
    pcPieceSize = 64,
    mobilePieceSize = 43,
    tabletPieceSize = 59
}: {
    isFlipped?: boolean;
    turnResult?: any;
    myColor: "white" | "black";
    gameId: string;
    socket: WebSocket | null;
    gameOver?: {
        result: 'white_win' | 'black_win' | 'draw';
        winner?: 'white' | 'black';
    } | null;
    userSkinId: any;
    opponentSkinId: any;
    isOpponentConnected: boolean;
    pcTileSize?: number;
    tabletTileSize?: number;
    mobileTileSize?: number;
    pcPieceSize?: number;
    tabletPieceSize?: number;
    mobilePieceSize?: number;
}) => {

    // 상태
    const [boardSizeType, setBoardSizeType] = useState<"pc" | "tablet" | "mobile">("pc");
    const [tileSize, setTileSize] = useState(pcTileSize);
    const [pieceSize, setPieceSize] = useState(pcPieceSize);

    const boardRef = useRef<HTMLDivElement>(null);
    const {
        selectedPiece,
        highlightedSquares,
        handlePieceClick,
        handlePieceMove,
        setSelectedPiece,
        setHighlightedSquares,
        handlePromotion,
        promotionInfo
    } = useChessMove({
        turnResult,
        myColor,
        socket,
        gameId,
    });

    // 체스판
    const boardGrid = boardTo2D(turnResult?.board || []);

    const rows = isFlipped ? [...boardGrid].reverse() : boardGrid;

    // 반응형 처리 시작 ---
    useEffect(() => {
        function updateSize() {
            const w = window.innerWidth;
            if (w >= 1024) setBoardSizeType("pc");
            else if (w >= 600) setBoardSizeType("tablet");
            else setBoardSizeType("mobile");
        }
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, []);
    useEffect(() => {
        if (boardSizeType === "pc") {
            setTileSize(pcTileSize);
            setPieceSize(pcPieceSize);
        } else if (boardSizeType === "tablet") {
            setTileSize(tabletTileSize);
            setPieceSize(tabletPieceSize);
        } else {
            setTileSize(mobileTileSize);
            setPieceSize(mobilePieceSize);
        }
    }, [boardSizeType, pcTileSize, tabletTileSize, mobileTileSize, pcPieceSize, tabletPieceSize, mobilePieceSize]);
    // 반응형 처리 완료 ---

    // 기물 이미지 불러오기
    function getPieceImage(piece: Piece, skinSetting: SkinSetting) {
        // Piece.type이 "pawn", "knight", ... 문자열이므로 key 생성
        const skinKey = `piece_skin_${piece.type}` as keyof SkinSetting;
        const skinId = skinSetting[skinKey];
        const colorFlag = piece.color === "white" ? 1 : 0;
        const imgUrl = `/asset/PieceImage/${skinId}_${colorFlag}.gif`;

        return imgUrl;
    }

    return (
        // 체스보드 전체 래퍼
        <div className="chess-board-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {/* EmotionOverlay (왼쪽) */}
            <div style={{ width: tileSize * 2, height: tileSize * 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* <EmotionOverlay ... /> */}
            </div>
            {/* 체스판 */}
            <div className="chess-board"
                style={{
                    width: tileSize * 8,
                    height: tileSize * 8,
                    display: "grid",
                    gridTemplateColumns: `repeat(8, ${tileSize}px)`,
                    gridTemplateRows: `repeat(8, ${tileSize}px)`
                }}>
                {rows.map((row, y) => {
                    // 2. 각 행 내부도 열(column) 순서 뒤집기
                    const cols = isFlipped ? [...row].reverse() : row;
                    return cols.map((piece, x) => {

                        // 실제 체스 규칙에서 사용하는 원본 인덱스 계산
                        const boardX = isFlipped ? 7 - x : x;
                        const boardY = isFlipped ? 7 - y : y;

                        let boardSkinId = userSkinId.board_skin;
                        const isMyHalf = myColor === "white" ? boardY >= 4 : boardY < 4;
                        if (!isMyHalf) boardSkinId = opponentSkinId.board_skin;

                        // 타일 이미지
                        const isDark = (boardX + boardY) % 2 === 0 ? 0 : 1;
                        const tileImg = `/asset/BoardImage/${boardSkinId}_${isDark}.png`;

                        let skinSetting: SkinSetting = userSkinId;

                        if (piece && piece.color !== myColor) skinSetting = opponentSkinId;

                        // 하이라이트 계산
                        const isHighlighted = highlightedSquares.some(
                            ([hx, hy]) => hx === boardX && hy === boardY
                        );
                        return (
                            <div
                                key={`${x}-${y}`}
                                style={{
                                    width: tileSize,
                                    height: tileSize,
                                    backgroundImage: `url(${tileImg})`,
                                    // background: (x + y) % 2 === 0 ? "#f0d9b5" : "#b58863",
                                    border: isHighlighted ? "2px solid #ff0" : "1px solid #aaa",
                                    position: "relative",
                                    boxSizing: "border-box",
                                    cursor: piece ? "pointer" : "default",
                                    zIndex: 1,
                                }}
                                onClick={() => {
                                    // selectedPiece는 화면상의 x, y를 저장/비교하도록!
                                    const movingPiece = selectedPiece
                                        ? boardGrid[selectedPiece[1]][selectedPiece[0]]
                                        : null;
                                    if (isHighlighted && selectedPiece && movingPiece) {
                                        handlePieceMove(selectedPiece, [boardX, boardY], movingPiece);
                                    } else {
                                        handlePieceClick(boardX, boardY, piece);
                                    }
                                }}
                            >
                                {piece && (
                                    <img
                                        src={getPieceImage(piece, skinSetting)}
                                        style={{
                                            width: pieceSize,
                                            height: pieceSize,
                                            userSelect: "none",
                                            pointerEvents: "none",
                                            display: "block",
                                            margin: "0 auto",
                                        }}
                                        draggable={false}
                                        alt={`${piece.color} ${piece.type}`}
                                    />
                                )}
                            </div>
                        );
                    });
                })}
            </div>
            {/* EmotionOverlay (오른쪽) */}
            <div style={{ width: tileSize * 2, height: tileSize * 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* <EmotionOverlay ... /> */}
            </div>
            {promotionInfo && (
                <PromotionModal
                    color={promotionInfo.piece.color}
                    onSelect={handlePromotion}
                />
            )}
        </div>
    );
}

export default ChessBoard2