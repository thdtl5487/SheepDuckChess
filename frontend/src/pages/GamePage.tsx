import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import { userAtom } from "../types/user";
import { ChessBoard } from "../components/game/ChessBoard";
import PlayerPanel from "../components/game/PlayerPanel";
import GameLog from "../components/game/GameLog";
import OverlayEffects from "../components/game/OverlayEffects";
import api from "../api/axiosInstance";
import { matchInfoAtom } from "../types/matchInfo";

// ⚠️ 이 변수를 컴포넌트 밖에 두어야 StrictMode 간에도 한 번만 열립니다.
let globalWsInitialized = false;

const GamePage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const [user, setUser] = useRecoilState(userAtom);
    const [turnResult, setTurnResult] = useState<any | null>(null);
    // const [myColor, setMyColor] = useState<"white" | "black">("white");
    const matchInfo = useRecoilValue(matchInfoAtom);
    const myColor = matchInfo?.yourColor ?? "white";
    // ⚠️ hasConnectedRef를 컴포넌트 내부에 두면 StrictMode 마운트→언마운트 사이클마다 초기화됩니다.
    // const socketRef = useRef<WebSocket | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);


    // useEffect(() => {
    //     console.log("🔥 WebSocket 연결 시작");
    //     (async () => {
    //         if (!user) {
    //             try {
    //                 const res = await api.post("/api/getUserInfoByRFToken", {}, { withCredentials: true });
    //                 setUser(res.data);
    //                 console.log("✅ user 복구됨", res.data);
    //             } catch (err) {
    //                 console.error("❌ user 복구 실패", err);
    //                 return;
    //             }
    //         }

    //         if (!gameId) return;


    //         // 3) 이미 열려 있는 소켓이 있으면 재사용
    //         if (socketRef.current?.readyState === WebSocket.OPEN) {
    //             console.log("▶️ 이미 연결된 WS 재사용");
    //             return;
    //         }

    //         const socket = new WebSocket("ws://localhost:4002");
    //         socketRef.current = socket;
    //         console.log("🔥 소켓 연결 시도");

    //         socket.onopen = () => {
    //             console.log("✅ WebSocket 연결됨, JOIN_GAME 전송");
    //             socket.send(JSON.stringify({
    //                 type: "JOIN_GAME",
    //                 gameId,
    //                 userId: user!.usn,
    //             }));
    //         };

    //         socket.onmessage = (event) => {
    //             const msg = JSON.parse(event.data);
    //             if (msg.type === "TURN_RESULT") {
    //                 console.log("📩 턴 결과 수신:", msg);
    //                 setTurnResult(msg);
    //             }
    //         };

    //         socket.onerror = (e) => {
    //             console.error("🚨 WebSocket 에러:", e);
    //         };

    //         socket.onclose = (e) => {
    //             console.warn("🔌 WebSocket 닫힘", e);
    //         };
    //     })();

    //     return () => {
    //         console.log("🧹 WebSocket 정리");
    //         socketRef.current?.close();
    //         socketRef.current = null;
    //     };

    // }, [gameId, user]); // ✅ user도 deps에 추가하면 더 안정적임

    // 1) user 복구 전담 이펙트
    useEffect(() => {
        if (user) return; // 이미 있으면 스킵
        api
            .post("/api/getUserInfoByRFToken", {}, { withCredentials: true })
            .then(res => {
                setUser(res.data);
                console.log("✅ user 복구됨", res.data);
            })
            .catch(err => {
                console.error("❌ user 복구 실패", err);
            });
    }, [user, setUser]);


    // 2) WebSocket 연결 전담 이펙트
    useEffect(() => {
        if (!user || !gameId || socket) return;
        globalWsInitialized = true; // ← 이 라인으로 이후 재실행 차단

        console.log("🔥 WebSocket 연결 시도");
        const ws = new WebSocket("ws://localhost:4002");
        setSocket(ws);

        ws.onopen = () => {
            console.log("✅ WebSocket 연결됨, JOIN_GAME 전송");
            ws.send(
                JSON.stringify({
                    type: "JOIN_GAME",
                    gameId,
                    userId: user.usn,
                })
            );
        };

        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);
            if (msg.type === "TURN_RESULT") {
                console.log("📩 턴 결과 수신:", msg);
                setTurnResult(msg);
            }
        };

        ws.onerror = e => {
            console.error("🚨 WebSocket 에러:", e);
        };

        ws.onclose = e => {
            console.warn("🔌 WebSocket 닫힘", e);
        };

        // 언마운트나 deps 변경 시 소켓 정리
        return () => {
            console.log("🧹 WebSocket 정리");
            ws.close();
        };
    }, [user, gameId]);

    return (
        <div className="relative w-full h-screen flex flex-col bg-gray-900 text-white">
            {/* 상단: 상대 플레이어 패널 */}
            <PlayerPanel side="opponent" />

            {/* 중앙: 체스판 + 연출 */}
            <div className="relative flex-1 flex items-center justify-center">
                <ChessBoard isFlipped={myColor === "black"} turnResult={turnResult} myColor={myColor} gameId={gameId!} socket={socket} />
                <OverlayEffects />
            </div>

            {/* 하단: 내 플레이어 패널 + 로그 */}
            <div className="flex flex-col md:flex-row w-full border-t border-gray-700">
                <PlayerPanel side="you" />
                <GameLog />
            </div>
        </div>
    );
};

export default GamePage;
