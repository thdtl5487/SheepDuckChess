import { useEffect, useRef } from "react";
import { User } from "../types/user";
import { useNavigate } from "react-router-dom";

type MatchFoundPayload = {
    user: User,
    triggerQueue: boolean,
    onMatched: (payload: MatchFoundPayload) => void
};
export function useMatchSocket(
    user: User,
    triggerQueue: boolean,
    onMatched: (payload: MatchFoundPayload) => void
) {
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!triggerQueue) return;

        const socket = new WebSocket("ws://localhost:4001");
        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "JOIN_QUEUE",
                payload: {
                    usn: user.usn,
                    nick: user.nick,
                    rating: user.rating,
                    maxDiff: 300,
                    skinSetting: {
                        piece_skin_pawn: user.pieceSkin.pawn,
                        piece_skin_knight: user.pieceSkin.knight,
                        piece_skin_bishop: user.pieceSkin.bishop,
                        piece_skin_rook: user.pieceSkin.rook,
                        piece_skin_queen: user.pieceSkin.queen,
                        piece_skin_king: user.pieceSkin.king,
                        board_skin: user.boardSkin,
                        character_id: user.character
                    }
                }
            }));
        };

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === "MATCH_FOUND") {
                onMatched(msg.payload);
            }
        };

        return () => {
            socket.close();
        };
    }, [triggerQueue]);
}
