import { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
import { userAtom } from "../types/user";
import { ChessBoard } from "../components/game/ChessBoard";
import PlayerPanel from "../components/game/PlayerPanel";
import GameLog from "../components/game/GameLog";
import OverlayEffects from "../components/game/OverlayEffects";
import { api } from "../utills/api";
import { matchInfoAtom, MatchInfo } from "../types/matchInfo";
import { useMatchSocket, MatchFoundPayload } from "../hooks/useMatchSocket";
import { gameURL } from "../utills/api";

const gameServerURL = gameURL;

let globalWsInitialized = false;

const GamePage = () => {
    const setMatchInfo = useSetRecoilState(matchInfoAtom);

    const [triggerQueue, setTriggerQueue] = useState(false);

    // Recoil state
    const [user, setUser] = useRecoilState(userAtom);
    const matchInfo = useRecoilValue(matchInfoAtom);

    console.log("matchInfo : ", matchInfo);
    // 매치 완료 후 리코일에 저장
    useMatchSocket(
        user!,
        triggerQueue,
        (payload: MatchFoundPayload) => {
            // MATCH_FOUND 콜백
            const {
                gameId: gId,
                yourColor,
                opponentNick,
                userSkinSetting: userSkinSetting,
                opponentSkinSetting: opponentSkinSetting
            } = payload;

            console.log("payload : ", payload);

            setMatchInfo({
                gameId: gId,
                yourColor,
                opponentNick,
                userSkinSetting,
                opponentSkinSetting: opponentSkinSetting
            });

            navigate(`/game/${gId}`);
        }
    );

    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();


    // Local state
    const [turnResult, setTurnResult] = useState<any | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [gameOver, setGameOver] = useState<{
        result: "white_win" | "black_win" | "draw";
        winner?: "white" | "black";
    } | null>(null);

    const myColor = matchInfo?.yourColor ?? "white";

    // 1) user 복구 전담 이펙트
    useEffect(() => {
        if (user) return; // 이미 있으면 스킵
        api
            .post("/api/getUserInfoByRFToken", {}, { withCredentials: true })
            .then(res => {
                setUser(res.data);
                console.log("✅ user 복구됨", res.data);
                // setTriggerQueue(true);
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
        const ws = new WebSocket(gameServerURL);
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

            switch (msg.type) {
                case "TURN_RESULT":
                    setTurnResult(msg);
                    break;
                case "GAME_OVER":
                    console.log("🎉 게임 종료!");
                    setGameOver({
                        result: msg.result,
                        winner: msg.winner,
                    });
                    break;
            }
        }

        ws.onerror = e => {
            console.error("🚨 WebSocket 에러:", e);
        };

        ws.onclose = e => {
            console.warn("🔌 WebSocket 닫힘", e);
        };

        // 매치 완료 후 리코일에 저장
        // useMatchSocket(
        //     user!,
        //     triggerQueue,
        //     (payload: MatchFoundPayload) => {
        //         // MATCH_FOUND 콜백
        //         const {
        //             gameId: gId,
        //             yourColor,
        //             opponentNick,
        //             userSkinSetting: userSkinSetting,
        //             opponentSkinSetting: opponentSkinSetting
        //         } = payload;

        //         setMatchInfo({
        //             gameId: gId,
        //             yourColor,
        //             opponentNick,
        //             userSkinSetting,
        //             opponentSkinSetting: opponentSkinSetting
        //         });

        //         navigate(`/game/${gId}`);
        //     }
        // );

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
                <ChessBoard isFlipped={myColor === "black"} turnResult={turnResult} myColor={myColor} gameId={gameId!} socket={socket} gameOver={gameOver} userSkinId={matchInfo?.userSkinSetting.character_id} opponentSkinId={matchInfo?.opponentSkinSetting.character_id} />
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
