// src/hooks/useTurnSender.ts
import { useCallback } from "react";
import { PieceType } from "../../types/piece";

export function useTurnSender(
    socket: WebSocket | null,
    gameId: string
) {
    const sendTurn = useCallback(
        (from: string, to: string, promotion: PieceType | null = null) => {
            if (!socket || socket.readyState !== WebSocket.OPEN) return;
            socket.send(
                JSON.stringify({ type: "TURN_MOVE", gameId, from, to, promotion })
            );
        },
        [socket, gameId]
    );

    return { sendTurn };
}
