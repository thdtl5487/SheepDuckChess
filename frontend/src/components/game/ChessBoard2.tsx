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

    // 애니메이션 연출용 ---
    const flatPieces = (turnResult?.board || []).filter(Boolean);

    function posToCoords(pos: string, isFlipped: boolean) {
        const file = pos.charCodeAt(0) - 97;
        const rank = 8 - parseInt(pos[1]);
        if (isFlipped) {
            return [7 - file, 7 - rank];
        } else {
            return [file, rank];
        }
    }

    // 드래그용 기능 정리
    const [dragInfo, setDragInfo] = useState<{
        from: [number, number];
        piece: Piece;
        startX: number;
        startY: number;
        mouseX: number;
        mouseY: number;
        mouseDownTime: number;
        isDragging: boolean;
    } | null>(null);
    const dragInfoRef = useRef(dragInfo);
    const [dragStart, setDragStart] = useState<{ x: number, y: number, piece: Piece, from: [number, number] } | null>(null);
    const [mouseDownTime, setMouseDownTime] = useState<number>(0);

    // dragInfo가 바뀔 때마다 ref도 업데이트
    useEffect(() => {
        dragInfoRef.current = dragInfo;
    }, [dragInfo]);

    const isMyPiece = dragInfo?.piece.color === myColor;
    const skinSetting = isMyPiece ? userSkinId : opponentSkinId;

    function onPieceMouseDown(
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        x: number,
        y: number,
        piece: Piece
    ) {
        if(piece.color != myColor) return;
        e.stopPropagation();
        e.preventDefault();    // ←★ 이거 필수!
        handlePieceClick(x, y, piece);
        setDragInfo({
            from: [x, y],
            piece,
            startX: e.clientX,
            startY: e.clientY,
            mouseX: e.clientX,
            mouseY: e.clientY,
            mouseDownTime: Date.now(),
            isDragging: false,
        });
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    }
    function handleDragMove(e: MouseEvent) {
        setDragInfo(prev => {
            if (!prev) return null;
            const dx = Math.abs(e.clientX - prev.startX);
            const dy = Math.abs(e.clientY - prev.startY);
            // 만약 4px 이상 이동했다면 드래그로 간주
            const DRAG_THRESHOLD = 4;
            if (!prev.isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
                return { ...prev, isDragging: true, mouseX: e.clientX, mouseY: e.clientY };
            }
            if (prev.isDragging) {
                return { ...prev, mouseX: e.clientX, mouseY: e.clientY };
            }
            // 아직 임계값 안 넘었으면 그대로
            return prev;
        });
    }

    function cleanupDrag() {
        setDragStart(null);
        setDragInfo(null);
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
    }
    // handleDragEnd 수정
    function handleDragEnd(e: MouseEvent) {
        const currDrag = dragInfoRef.current;
        if (!currDrag) { cleanupDrag(); return; }

        const { startX, startY, mouseDownTime, isDragging, from, piece } = currDrag;
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        const dt = Date.now() - mouseDownTime;

        if (!isDragging && dx < 5 && dy < 5 && dt < 500) {
            // "클릭"으로 간주!
            handlePieceClick(from[0], from[1], piece);
        } else if (isDragging) {
            // "드래그"로 간주
            const boardRect = boardRef.current?.getBoundingClientRect();
            if (!boardRect) { cleanupDrag(); return; }
            const relX = e.clientX - boardRect.left;
            const relY = e.clientY - boardRect.top;
            const toX = Math.floor(relX / tileSize);
            const toY = Math.floor(relY / tileSize);
            if (toX >= 0 && toX < 8 && toY >= 0 && toY < 8) {
                handlePieceMove(from, [toX, toY], piece);
            }
        }
        cleanupDrag();
    }

    function posToXY(pos: string, isFlipped: boolean): [number, number] {
        // pos는 예를 들어 "e4"
        const file = pos.charCodeAt(0) - 97;       // "a"=0, ..., "h"=7
        const rank = 8 - parseInt(pos[1]);         // "1"=7, "8"=0
        // isFlipped면 좌우상하 반전
        const result = isFlipped ? [7 - file, 7 - rank] : [file, rank];
        return isFlipped ? [7 - file, 7 - rank] : [file, rank];;
    }

    // 드래그 끝

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
        isFlipped
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
                ref={boardRef}
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
                        const [toClickX, toClickY] = posToXY(`${"abcdefgh"[boardX]}${8 - boardY}`, isFlipped);

                        let boardSkinId = userSkinId.board_skin;
                        const isMyHalf = myColor === "white" ? boardY >= 4 : boardY < 4;
                        if (!isMyHalf) boardSkinId = opponentSkinId.board_skin;

                        // 타일 이미지
                        const isDark = (boardX + boardY) % 2 === 0 ? 1 : 0;
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
                                    border: isHighlighted ? "2px solid #ff0" : "1px solid #aaa",
                                    position: "relative",
                                    boxSizing: "border-box",
                                    cursor: piece ? "pointer" : "default",
                                    zIndex: 1,
                                }}
                                onClick={() => {
                                    // selectedPiece는 화면상의 x, y를 저장/비교함
                                    let movingPiece = null;
                                    if (selectedPiece) {
                                        const [selX, selY] = selectedPiece;
                                        const realX = isFlipped ? 7 - selX : selX;
                                        const realY = isFlipped ? 7 - selY : selY;
                                        movingPiece = boardGrid[realY][realX];
                                    }

                                    if (isHighlighted && selectedPiece && movingPiece) {
                                        handlePieceMove(selectedPiece, [toClickX, toClickY], movingPiece);
                                    } else {
                                        handlePieceClick(toClickX, toClickY, piece);
                                    }
                                }}
                            >
                            </div>
                        );
                    });
                })}

                {/* 기물 렌더 */}
                {flatPieces.map((piece: Piece) => {
                    const [x, y] = posToXY(piece.position, isFlipped);

                    if (
                        dragInfo &&
                        dragInfo.piece.position === piece.position &&
                        dragInfo.piece.type === piece.type &&
                        dragInfo.piece.color === piece.color
                    ) {
                        return null; // 잡은 건 아래에서 따로 그림
                    }
                    // 이동중 기물 여부
                    const isMovedPiece =
                        turnResult?.lastMove?.to === piece.position;

                    // from→to 좌표 (절대 px)
                    const [toX, toY] = posToCoords(piece.position, isFlipped);
                    const tilePx = tileSize; // 칸 사이즈
                    let fromX = toX, fromY = toY;
                    if (isMovedPiece && turnResult?.lastMove?.from) {
                        [fromX, fromY] = posToCoords(turnResult.lastMove.from, isFlipped);
                    }

                    // 스킨/이미지
                    let skinSetting: SkinSetting = userSkinId;
                    if (piece.color !== myColor) skinSetting = opponentSkinId;
                    const imgUrl = getPieceImage(piece, skinSetting);

                    return (
                        <motion.div
                            key={piece.position + piece.type + piece.color}
                            initial={{ x: fromX * tilePx, y: fromY * tilePx }}
                            animate={{ x: toX * tilePx, y: toY * tilePx }}
                            transition={{ duration: isMovedPiece ? 0.3 : 0 }}
                            style={{
                                position: "absolute",
                                width: pieceSize,
                                height: pieceSize,
                                zIndex: 10,
                                opacity:
                                    dragInfo &&
                                        dragInfo.piece.position === piece.position &&
                                        dragInfo.piece.type === piece.type &&
                                        dragInfo.piece.color === piece.color
                                        ? 0.5
                                        : 1,
                                pointerEvents: piece.color === myColor ? "auto" : "none",
                            }}
                            onMouseDown={e => {
                                onPieceMouseDown(e, x, y, piece)
                            }
                            }
                        >
                            <img
                                src={imgUrl}
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
                        </motion.div>
                    );
                })}
                {dragInfo && (
                    <motion.div
                        style={{
                            position: "fixed",
                            pointerEvents: "none",
                            zIndex: 999,
                            left: dragInfo.mouseX - pieceSize / 2,
                            top: dragInfo.mouseY - pieceSize / 2,
                            width: pieceSize * 1.15,
                            height: pieceSize * 1.15,
                            opacity: 0.95,
                            transform: "scale(1.08)"
                        }}
                    >
                        <img
                            src={getPieceImage(dragInfo.piece, skinSetting)}
                            style={{
                                width: "100%",
                                height: "100%",
                                userSelect: "none",
                            }}
                            draggable={false}
                            alt="dragging"
                        />
                    </motion.div>
                )}
                {/* 기물 렌더 END */}

            </div>
            {/* EmotionOverlay (오른쪽) */}
            <div style={{ width: tileSize * 2, height: tileSize * 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* <EmotionOverlay ... /> */}
            </div>
            {
                promotionInfo && (
                    <PromotionModal
                        color={promotionInfo.piece.color}
                        onSelect={handlePromotion}
                    />
                )
            }
        </div >
    );
}

export default ChessBoard2