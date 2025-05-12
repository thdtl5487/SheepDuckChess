import { useEffect, useRef } from "react";
import { User } from "../types/user";
import { SkinSetting } from "../types/matchInfo";

// 매칭이 성사되었을 때 전달되는 payload 타입 정의
export type MatchFoundPayload = {
    gameId: string;
    yourColor: "white" | "black";
    opponentNick: string;
    userSkinSetting: SkinSetting;         // 내 스킨
    opponentSkinSetting : SkinSetting;    // 상대 스킨
    user?: User;
    triggerQueue?: boolean;
};

/**
 * useMatchSocket
 * - 매칭을 위한 WebSocket을 생성하고 관리하는 커스텀 훅
 * - triggerQueue가 true가 되면 소켓 연결 + JOIN_QUEUE 전송
 * - 매칭 성사 시 onMatched 콜백 실행
 * - 외부에서 매칭 취소(LEAVE_QUEUE)를 보낼 수 있도록 socketRef 반환
 */
export function useMatchSocket(
    user: User,
    triggerQueue: boolean,
    onMatched: (payload: MatchFoundPayload) => void
): React.MutableRefObject<WebSocket | null> {
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!triggerQueue) return;

        // 소켓 연결
        const socket = new WebSocket("ws://localhost:4001"); // match-server 주소
        socketRef.current = socket;

        // 연결되었을 때 JOIN_QUEUE 전송
        socket.onopen = () => {
            console.log("조인큐 실행!!");
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
                        character_id: user.character,
                    }
                }
            }));
        };

        // 서버로부터 메시지 수신
        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === "MATCH_FOUND") {
                const {
                    gameId,
                    yourColor,
                    opponentNick,
                    userSkinSetting: userSkinSetting,
                    opponentSkinSetting : opponentSkinSetting
                } = msg.payload as MatchFoundPayload;

                // recoil에 저장할 형태로 변환해서 콜백 호출
                onMatched({
                    gameId,
                    yourColor,
                    opponentNick,
                    userSkinSetting: userSkinSetting,
                    opponentSkinSetting : opponentSkinSetting
                });
            }
        };
        // 언마운트 또는 재접속 시 소켓 종료
        return () => {
            socket.close();
        };
    }, [triggerQueue, user, onMatched]);

    // socketRef를 반환하여 외부에서 메시지 전송 가능하게 함
    return socketRef;
}
