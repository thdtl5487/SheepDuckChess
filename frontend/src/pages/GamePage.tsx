import { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
import { userAtom } from "../types/user";
import ChessBoard2 from "../components/game/ChessBoard2";
import PlayerPanel from "../components/game/PlayerPanel";
import GameLog from "../components/game/GameLog";
import OverlayEffects from "../components/game/OverlayEffects";
import { api } from "../utills/api";
import { matchInfoAtom, MatchInfo } from "../types/matchInfo";
import { useMatchSocket, MatchFoundPayload } from "../hooks/inGame/useMatchSocket";
import { gameURL } from "../utills/api";
import { ChessBoard } from "../components/game/ChessBoard";

const gameServerURL = gameURL;

let globalWsInitialized = false;

const RECONNECT_INTERVAL = 3000; // ms
const MAX_RETRIES = 5;


const GamePage = () => {
    const setMatchInfo = useSetRecoilState(matchInfoAtom);

    const [triggerQueue, setTriggerQueue] = useState(false);

    const [overlay, setOverlay] = useState<{ attackerImage?: string; victimImage?: string; isVisible: boolean }>({
        isVisible: false
    });

    function showCaptureEffect(attackerSkinId: number, victimSkinId: number) {
        setOverlay({
            attackerImage: `/asset/PieceAnime/${attackerSkinId}_attack.gif`,
            victimImage: `/asset/PieceAnime/${victimSkinId}_hit.gif`,
            isVisible: true,
        });
        setTimeout(() => setOverlay((prev) => ({ ...prev, isVisible: false })), 1000); // 1초 뒤 꺼짐
    }

    // Recoil state
    const [user, setUser] = useRecoilState(userAtom);
    const matchInfo = useRecoilValue(matchInfoAtom);

    // console.log("matchInfo : ", matchInfo);
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
    const reconnectCount = useRef(0);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const [isOpponentConnected, setIsOpponentConnected] = useState(true);

    const [gameOver, setGameOver] = useState<{
        result: "white_win" | "black_win" | "draw";
        winner?: "white" | "black";
    } | null>(null);

    const myColor = matchInfo?.yourColor ?? "white";

    // 새로고침 시 게임 복구
    useEffect(() => {
        // 1) 리코일에 없고, 스토리지엔 있는 경우
        if (!matchInfo && localStorage.getItem('matchInfo')) {
            try {
                const saved = JSON.parse(localStorage.getItem('matchInfo')!);
                setMatchInfo(saved);
            } catch {
                localStorage.removeItem('matchInfo');
                navigate('/lobby');
            }
        }
    }, [matchInfo, setMatchInfo, navigate]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('matchInfo')!).gameId;

        // 2) 저장된 게임 ID가 없으면 → 로비로
        if (!stored) {
            navigate("/main");
            return;
        }

        // 3) URL param(gameId) 과 로컬 스토리지 ID가 다르면
        //    → 로컬 스토리지 기준으로 경로 보정
        if (stored !== gameId) {
            navigate(`/game/${stored}`);
            return;
        }

        // 4) 여기까지 통과하면 `stored === gameId` 상태,
        //    바로 WebSocket 연결 로직으로 넘어갑니다.
    }, [gameId, navigate]);

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

    // ① connectWebSocket 함수로 ws 초기화 + 핸들러 등록
    const connectWebSocket = () => {
        console.log("🔥 WebSocket 연결 시도");
        const ws = new WebSocket(gameServerURL);

        setSocket(ws);

        ws.onopen = () => {
            reconnectCount.current = 0;
            console.log("✅ WebSocket 연결됨, JOIN_GAME 전송");
            ws.send(JSON.stringify({
                type: "JOIN_GAME",
                gameId,
                userId: user!.usn
            }));
        };

        ws.onmessage = evt => {
            const msg = JSON.parse(evt.data);
            // console.log("message : ", msg);

            switch (msg.type) {
                case "TURN_RESULT":
                    setTurnResult(msg);
                    break;
                case "GAME_OVER":
                    setGameOver({ result: msg.result, winner: msg.winner });
                    localStorage.removeItem('matchInfo');
                    break;
                case "OPPONENT_DISCONNECTED":
                    setIsOpponentConnected(false);
                    break;
                case "OPPONENT_RECONNECTED":
                    setIsOpponentConnected(true);
                    break;
            }
        };

        ws.onerror = e => {
            console.error("🚨 WebSocket 에러:", e);
            ws.close();
        };

        ws.onclose = e => {
            console.warn("🔌 WebSocket 닫힘", e);
            if (reconnectCount.current < MAX_RETRIES) {
                reconnectCount.current += 1;
                reconnectTimer.current = setTimeout(
                    connectWebSocket,
                    RECONNECT_INTERVAL
                );
            } else {
                localStorage.removeItem("matchInfo");
                navigate("/lobby");
            }
        };
    };

    useEffect(() => {
        if (!user || !gameId) return;
        // socket이 없을 때만 연결 시도
        if (!socket) connectWebSocket();

        return () => {
            // cleanup: 타이머 해제, 소켓 닫기
            reconnectTimer.current && clearTimeout(reconnectTimer.current);
            socket?.close();
        };
    }, [user, gameId]);

    return (
        <div className="relative w-full h-screen flex flex-col bg-gray-900 text-white">
            {/* 상단: 상대 플레이어 패널 */}
            <PlayerPanel side="opponent" />

            {/* 소켓나가기 */}
            <button
                className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded z-50"
                onClick={() => {
                    socket?.close();
                }}
            >
                Close Socket
            </button>

            {/* 나가기 버튼 */}
            <button
                className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded"
                onClick={() => {
                    localStorage.removeItem("matchInfo");
                    navigate("/main");
                }}
            >
                Leave Game (테스트)
            </button>

            {/* 중앙: 체스판 + 연출 */}
            <div className="relative flex-1 flex items-center justify-center w-full h-full min-h-0 overflow-hidden">
                {/* <ChessBoard isFlipped={myColor === "black"} turnResult={turnResult} myColor={myColor} gameId={gameId!} socket={socket} gameOver={gameOver} userSkinId={matchInfo?.userSkinSetting} opponentSkinId={matchInfo?.opponentSkinSetting} isOpponentConnected={isOpponentConnected} /> */}
                <ChessBoard2 isFlipped={myColor === "black"} turnResult={turnResult} myColor={myColor} gameId={gameId!} socket={socket} gameOver={gameOver} userSkinSetting={matchInfo?.userSkinSetting} opponentSkinSetting={matchInfo?.opponentSkinSetting} isOpponentConnected={isOpponentConnected} onCapture={(attackerSkinId: number, victimSkinId: number) => showCaptureEffect(attackerSkinId, victimSkinId)} />

                <OverlayEffects attackerImage={overlay.attackerImage} victimImage={overlay.victimImage} isVisible={overlay.isVisible} />
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
