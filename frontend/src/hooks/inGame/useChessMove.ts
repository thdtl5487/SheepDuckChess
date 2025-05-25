import { useState } from "react";
import type { Piece, PieceType } from "../../types/piece";
import * as ChessRules from "../../components/game/ChessRules";
import { useTurnSender } from "./useTurnSender";

type UseChessMoveProps = {
    turnResult: any;
    myColor: "white" | "black";
    socket: WebSocket | null;
    gameId: string;
};

export function useChessMove({
    turnResult,
    myColor,
    socket,
    gameId,
}: UseChessMoveProps) {
    const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(null);
    const [highlightedSquares, setHighlightedSquares] = useState<[number, number][]>([]);
    const [promotionInfo, setPromotionInfo] = useState<{
        from: [number, number];
        to: [number, number];
        piece: Piece;
    } | null>(null);
    const { sendTurn } = useTurnSender(socket, gameId);

    // 기물 클릭 (선택/이동/하이라이트)
    function handlePieceClick(x: number, y: number, piece: Piece | null) {
        if (!turnResult || !turnResult.turn) return; // turnResult가 없으면 무시!
        if (turnResult.turn !== myColor) return;

        if (!piece) {
            setSelectedPiece(null);
            setHighlightedSquares([]);
            return;
        }
        if (selectedPiece && selectedPiece[0] === x && selectedPiece[1] === y) {
            setSelectedPiece(null);
            setHighlightedSquares([]);
            return;
        }
        setSelectedPiece([x, y]);

        // 변환 함수: (x, y) → 체스 좌표 ("e2" 등)
        function xyToSquare(x: number, y: number) {
            const file = "abcdefgh"[x];
            const rank = 8 - y; // y:0이 8번째 rank
            return `${file}${rank}`;
        }
        const from = xyToSquare(x, y);

        // Piece 타입/컬러 구하기
        // turnResult.board가 2차원 배열이라면:
        const thisPiece = turnResult.board[y][x];
        const type = thisPiece?.type || piece.type; // piece가 객체면 그대로, 아니면 type 값 넣기
        const color = thisPiece?.color || piece.color;

        // moved, enPassantTarget 추출
        const moved = turnResult.moved || {};
        const enPassantTarget = turnResult.enPassantTarget || null;

        // 이동 가능 칸 계산
        const moves: [number, number][] = [];
        for (let ty = 0; ty < 8; ty++) {
            for (let tx = 0; tx < 8; tx++) {
                if (tx === x && ty === y) continue;
                const to = xyToSquare(tx, ty);
                if (
                    ChessRules.isValidMove(
                        from,
                        to,
                        type,
                        color,
                        turnResult.board.flat(), // 2차원 -> 1차원 flatten
                        moved,
                        enPassantTarget
                    )
                ) {
                    moves.push([tx, ty]);
                }
            }
        }
        setHighlightedSquares(moves);
    }

    // 실제 이동(서버 전송 등)

    function xyToSquare(x: number, y: number) {
        const file = "abcdefgh"[x];
        const rank = 8 - y;
        return `${file}${rank}`;
    }

    function handlePromotion(type: PieceType) {
        if (!promotionInfo) return;

        console.log("promotion type : ", type);
        const fromPos = xyToSquare(promotionInfo.from[0], promotionInfo.from[1]);
        const toPos = xyToSquare(promotionInfo.to[0], promotionInfo.to[1]);
        sendTurn(fromPos, toPos, type);
        setPromotionInfo(null);
        setSelectedPiece(null);
        setHighlightedSquares([]);
    }

    function handlePieceMove(
        from: [number, number],
        to: [number, number],
        piece: Piece
    ) {
        const fromPos = xyToSquare(from[0], from[1]);
        const toPos = xyToSquare(to[0], to[1]);

        // 이동 후 위치로 임시 Piece 객체를 만들어서 프로모션 체크
        const tempPiece: Piece = { ...piece, position: toPos };
        let promotion: Piece | null = null;
        const samplePiece: PieceType = 'queen';

        promotion = {
            type: samplePiece,
            color: piece.color,
            position: toPos
        }

        if (ChessRules.isPromotionSquare(tempPiece)) {
            setPromotionInfo({ from, to, piece }); // from, to는 내부 x, y!
            return;
        }

        // useTurnSender 훅 사용
        sendTurn(fromPos, toPos, promotion.type);
        setSelectedPiece(null);
        setHighlightedSquares([]);
    }

    return {
        selectedPiece,
        highlightedSquares,
        handlePieceClick,
        handlePieceMove,
        handlePromotion,
        promotionInfo,
        setSelectedPiece,
        setHighlightedSquares,
    };
}
