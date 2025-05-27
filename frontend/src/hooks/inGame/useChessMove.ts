import { useState } from "react";
import type { Piece, PieceType } from "../../types/piece";
import * as ChessRules from "../../components/game/ChessRules";
import { useTurnSender } from "./useTurnSender";
import { SkinSetting } from "../../types/matchInfo";

type UseChessMoveProps = {
    turnResult: any;
    myColor: "white" | "black";
    socket: WebSocket | null;
    gameId: string;
    isFlipped: boolean;
    onCapture?: (attackerSkinId: number, victimSkinId: number) => void;
    userSkinSetting: SkinSetting;
    opponentSkinSetting: SkinSetting;
};

export function useChessMove({
    turnResult,
    myColor,
    socket,
    gameId,
    isFlipped,
    onCapture,
    userSkinSetting,
    opponentSkinSetting
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
        if (!turnResult || !turnResult.turn) return;
        if (turnResult.turn !== myColor) return;

        if (!piece || piece.color !== myColor) {
            setSelectedPiece(null);
            setHighlightedSquares([]);
            return;
        }

        // position(예: "a2")로 찾자
        const type = piece.type;
        const color = piece.color;
        const from = piece.position; // 현재 정상
        setSelectedPiece([x, y]);

        const moved = turnResult.moved || {};
        const enPassantTarget = turnResult.enPassantTarget || null;

        // 이동 가능 칸 계산
        const moves: [number, number][] = [];
        for (let ty = 0; ty < 8; ty++) {
            for (let tx = 0; tx < 8; tx++) {
                // 화면 좌표 → 체스 position
                const to = "abcdefgh"[tx] + (8 - ty);
                if (to === from) continue;

                if (
                    ChessRules.isValidMove(
                        from,
                        to,
                        type,
                        color,
                        turnResult.board,
                        moved,
                        enPassantTarget
                    )
                ) {
                    // 하이라이트 좌표도 화면 기준 그대로 push
                    moves.push([tx, ty]);
                }
            }
        }
        setHighlightedSquares(moves);
    }


    // 실제 이동(서버 전송 등)
    function xyToSquare(x: number, y: number) {
        const boardX = isFlipped ? 7 - x : x;
        const boardY = isFlipped ? 7 - y : y;
        const file = "abcdefgh"[boardX];
        const rank = 8 - boardY;
        return `${file}${rank}`;
    }

    function handlePromotion(type: PieceType) {
        if (!promotionInfo) return;

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
        piece: Piece,
    ) {
        const fromPos = xyToSquare(from[0], from[1]);
        const toPos = xyToSquare(to[0], to[1]);

        // --- 프로모션 체크
        let promotion: Piece = { ...piece, position: toPos };

        promotion = {
            type: promotion.type,
            color: piece.color,
            position: toPos
        }

        if (ChessRules.isPromotionSquare(promotion)) {
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
