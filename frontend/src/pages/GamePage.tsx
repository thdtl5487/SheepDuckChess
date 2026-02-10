import { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
import { userAtom } from "../types/user";
import ChessBoard2 from "../components/game/ChessBoard2";
import PlayerPanel from "../components/game/PlayerPanel";
import GameLog from "../components/game/GameLog";
import OverlayEffects from "../components/game/OverlayEffects";
import IngameAlertModal from "../components/game/IngameAlertModal";
import { api } from "../utills/api";
import { matchInfoAtom, MatchInfo, SkinSetting } from "../types/matchInfo";
import { useMatchSocket, MatchFoundPayload } from "../hooks/inGame/useMatchSocket";
import { gameURL } from "../utills/api";
import { useAnimationMeta } from "../hooks/inGame/useAnimationMeta";
import { ChessBoard } from "../components/game/ChessBoard";
import { Piece } from "../types/piece";
import type { OverlayEvent } from "../types/overlayEvent";


const gameServerURL = gameURL;

let globalWsInitialized = false;

const RECONNECT_INTERVAL = 3000; // ms
const MAX_RETRIES = 5;


const GamePage = () => {
    const setMatchInfo = useSetRecoilState(matchInfoAtom);
    const [triggerQueue, setTriggerQueue] = useState(false);
    const { getMeta } = useAnimationMeta();
    const [overlayQueue, setOverlayQueue] = useState<OverlayEvent[]>([]);
    const [currentOverlay, setCurrentOverlay] = useState<OverlayEvent | null>(null);
    const [user, setUser] = useRecoilState(userAtom);
    const matchInfo = useRecoilValue(matchInfoAtom);
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const [turnResult, setTurnResult] = useState<any | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const reconnectCount = useRef(0);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const [isOpponentConnected, setIsOpponentConnected] = useState(true);
    const [clockSync, setClockSync] = useState<{
        initialMs: number;
        whiteMs: number;
        blackMs: number;
        turn: "white" | "black";
        serverNow: number;
    } | null>(null);
    const prevTurnResultRef = useRef<any>(null);
    const [gameOver, setGameOver] = useState<{
        result: "white_win" | "black_win" | "draw";
        winner?: "white" | "black";
        reason?: string;
    } | null>(null);
    const myColor = matchInfo?.yourColor ?? "white";



    // === 캡처 연출 큐 ===
    function showCaptureEffect(attackerSkinId: number, victimSkinId: number, isOpponentAttack: boolean) {
        const attackerMeta = getMeta(attackerSkinId);
        const playTime = attackerMeta?.playTime ?? 1800;
        const hitMeta = getMeta(victimSkinId);
        const hitTime = hitMeta?.hitTime ?? 700;
        const id = Date.now() + Math.random();
        setOverlayQueue(q => [
            ...q,
            {
                id,
                attackerImage: `/asset/PieceAnime/${attackerSkinId}_attack.gif`,
                victimImage: `/asset/PieceAnime/${victimSkinId}_attack.gif`, // TODO _ 나중에 리소스 바꾸면 꼭 바꿀것
                isOpponentAttack,
                playTime,
                hitTime
            }
        ]);
    }

    // 3. currentOverlay 관리 (1개씩 보여주기)
    useEffect(() => {
        if (!currentOverlay && overlayQueue.length > 0) {
            setCurrentOverlay(overlayQueue[0]);
            setOverlayQueue(queue => queue.slice(1));
            // 일정 시간 후 애니 종료 (playTime)
            setTimeout(() => setCurrentOverlay(null), overlayQueue[0].playTime);
        }
    }, [overlayQueue, currentOverlay]);

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

    // 캡처 상황 감지 후 overlay큐에 추가
    useEffect(() => {
        if (!turnResult?.lastMove) return;
        const prevFlatBoard: Piece[] = prevTurnResultRef.current?.board ?? [];
        const currFlatBoard: Piece[] = turnResult.board ?? [];
        if (currFlatBoard.length < prevFlatBoard.length) {
            const lostPiece = prevFlatBoard.find(
                (prevPiece) =>
                    !currFlatBoard.some(
                        (currPiece) =>
                            currPiece.position === prevPiece.position &&
                            currPiece.type === prevPiece.type &&
                            currPiece.color === prevPiece.color
                    )
            );
            const { to } = turnResult.lastMove;
            const movedPiece = currFlatBoard.find((p) => p.position === to);
            if (lostPiece && movedPiece) {
                const attackerKey = `piece_skin_${movedPiece.type}` as keyof SkinSetting;
                const attackerSkinId = movedPiece.color === matchInfo?.yourColor ? matchInfo?.userSkinSetting?.[attackerKey] : matchInfo?.opponentSkinSetting?.[attackerKey];
                const victimKey = `piece_skin_${lostPiece.type}` as keyof SkinSetting;
                const victimSkinId = lostPiece.color === matchInfo?.yourColor ? matchInfo?.userSkinSetting?.[victimKey] : matchInfo?.opponentSkinSetting?.[victimKey];
                if (typeof attackerSkinId === "number" && typeof victimSkinId === "number") {
                    if (myColor === lostPiece.color) {
                        showCaptureEffect(attackerSkinId, victimSkinId, true);
                    } else {
                        showCaptureEffect(attackerSkinId, victimSkinId, false);
                    }
                }
            }
        }
        prevTurnResultRef.current = turnResult;
    }, [turnResult, matchInfo]);


    // 1. prevTurnResultRef는 항상 turnResult 바뀐 뒤 최신화
    useEffect(() => {
        console.log('prevTurnResultRef : ', prevTurnResultRef)
        if (turnResult) {
            prevTurnResultRef.current = turnResult
        };

    }, [turnResult]);

    // connectWebSocket 함수로 ws 초기화 + 핸들러 등록
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
                    if (msg.clocks) setClockSync(msg.clocks);
                    break;
                case "CLOCK_SYNC":
                    if (msg.clocks) setClockSync(msg.clocks);
                    break;
                case "GAME_OVER":
                    setGameOver({ result: msg.result, winner: msg.winner, reason: msg.reason });
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

    function formatMs(ms: number) {
        const total = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    }

    const now = Date.now();
    const whiteMsLive = clockSync
        ? clockSync.whiteMs - (clockSync.turn === "white" ? (now - clockSync.serverNow) : 0)
        : null;
    const blackMsLive = clockSync
        ? clockSync.blackMs - (clockSync.turn === "black" ? (now - clockSync.serverNow) : 0)
        : null;

    const myMs = myColor === "white" ? whiteMsLive : blackMsLive;
    const oppMs = myColor === "white" ? blackMsLive : whiteMsLive;

    const myTimeText = typeof myMs === 'number' ? formatMs(myMs) : undefined;
    const oppTimeText = typeof oppMs === 'number' ? formatMs(oppMs) : undefined;

    const modalTitle = gameOver
        ? gameOver.result === 'draw'
            ? '무승부'
            : gameOver.winner === myColor
                ? '승리'
                : '패배'
        : '';

    const modalMessage = gameOver
        ? gameOver.reason === 'timeout'
            ? (gameOver.winner === myColor ? '상대 시간 초과로 승리했습니다.' : '시간 초과로 패배했습니다.')
            : (gameOver.result === 'draw'
                ? '게임이 무승부로 종료되었습니다.'
                : (gameOver.winner === myColor ? '게임에서 승리했습니다.' : '게임에서 패배했습니다.'))
        : '';

    return (
        <div className="relative w-full h-screen flex flex-col bg-gray-900 text-white">
            {/* 상단: 상대 플레이어 패널 */}
            <PlayerPanel
                side="opponent"
                nick={matchInfo?.opponentNick}
            />

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
                <ChessBoard2
                    isFlipped={myColor === "black"}
                    turnResult={turnResult}
                    myColor={myColor}
                    gameId={gameId!}
                    socket={socket}
                    gameOver={gameOver}
                    userSkinSetting={matchInfo?.userSkinSetting}
                    opponentSkinSetting={matchInfo?.opponentSkinSetting}
                    isOpponentConnected={isOpponentConnected}
                    myTimeText={myTimeText}
                    opponentTimeText={oppTimeText}
                />
                <OverlayEffects attackerImage={currentOverlay?.attackerImage} victimImage={currentOverlay?.victimImage} isOpponentAttack={currentOverlay?.isOpponentAttack} gifKey={currentOverlay?.id}/>
            </div>

            {/* 하단: 내 플레이어 패널 + 로그 */}
            <div className="flex flex-col md:flex-row w-full border-t border-gray-700">
                <PlayerPanel
                    side="you"
                    nick={user?.nick}
                />
                <GameLog />
            </div>

            <IngameAlertModal
                isOpen={!!gameOver}
                title={modalTitle}
                message={modalMessage}
                confirmText="메인으로"
                onConfirm={() => {
                    navigate('/main');
                }}
            />
        </div>
    );
};

export default GamePage;
