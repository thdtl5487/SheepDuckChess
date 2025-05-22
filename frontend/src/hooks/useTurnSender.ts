// src/hooks/useTurnSender.ts
import { useCallback } from "react";

export function useTurnSender(
    socket: WebSocket | null,
    gameId: string
) {
    const sendTurn = useCallback(
        (from: string, to: string) => {
            if (!socket || socket.readyState !== WebSocket.OPEN) return;
            socket.send(
                JSON.stringify({ type: "TURN_MOVE", gameId, from, to })
            );
        },
        [socket, gameId]
    );

    return { sendTurn };
}
