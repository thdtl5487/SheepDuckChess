// 🔁 최상단 수정
import { WebSocketServer } from "ws";
import * as ws from "ws"; // ✅ 추가
import { SessionManager } from "./sessions/SessionManager";
import dotenv from 'dotenv';

dotenv.config();

console.log("GAME SERVER PORT : ", process.env.PORT_GAME);

const wss = new WebSocketServer({ port: Number(process.env.PORT_GAME) || 8080 });
const sessionManager = new SessionManager();

wss.on("listening", () => {
    const addr = wss.address();
    console.log("🎧 WSS 포트:", typeof addr === "object" ? addr?.port : addr);
});

wss.on("connection", (socket: ws.WebSocket) => {
    console.log("✅ New player connected!");

    let boundSession: ReturnType<SessionManager['getSession']> | null = null;
    let boundUserId: string | null = null;
    let boundGameId: string | null = null;

    socket.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        // console.log("message : ", msg);
        if (msg.type === "JOIN_GAME") {
            console.log(`🔗 유저 ${msg.userId} 가 ${msg.gameId} 세션에 접속 시도`);

            const session = sessionManager.getSession(msg.gameId);

            // console.log(session);
            if (!session) {
                console.log("😨바인딩 대실패 gameId : ", msg);
                socket.send(JSON.stringify({ type: "ERROR", message: "세션 없음" }));
                return;
            }

            const already = session.hasUser(msg.userId);

            session.bindSocket(msg.userId, socket);
            boundSession = session;
            boundUserId = msg.userId;
            boundGameId = msg.gameId;
            if (already) {
                session.broadcast({ type: "OPPONENT_RECONNECTED", userId: msg.userId });
            }

            console.log(`✅ ${msg.userId} 바인딩 완료`);

            // 재접 메시지
            if (already) {
                session.broadcast({
                    type: "OPPONENT_RECONNECTED",
                    userId: msg.userId
                });
            }
        }

        if (msg.type === "TURN_MOVE") {
            const { gameId, from, to, promotion } = msg;

            console.log("turn move - from : ", from , ", to : ", to, ", promotion : ", promotion)

            const session = sessionManager.getSession(gameId);
            if (!session) {
                socket.send(JSON.stringify({ type: "ERROR", error: "Game not found" }));
                return;
            }
            session.applyMove(from, to, promotion);
        }

        if (msg.type === "GAME_START") {
            console.log("GAME START 메세지 받았음!!");
            const { white, black, gameId, timeControlSec } = msg;
            if (!sessionManager.hasSession(gameId)) {
                console.log("GAME START 세션 생성 중 ..... ");
                sessionManager.createSession(gameId, white, black, typeof timeControlSec === 'number' ? timeControlSec : 600);
                socket.send(JSON.stringify({ type: "GAME_STARTED", gameId }));
            }
        }
    });

    socket.on("close", () => {
        if (boundSession && boundUserId && boundGameId) {
            // 소켓 언바인드
            boundSession.unbindSocket(boundUserId);
            // 상대 끊김 알림
            boundSession.broadcast({ type: "OPPONENT_DISCONNECTED", userId: boundUserId });
            // 빈 세션이면 완전 삭제
            if ((boundSession as any).playerSockets.size === 0) {
                sessionManager.deleteSession(boundGameId);
            }
        }
    })
});

const CLEANUP_INTERVAL = 1000 * 60 * 5; // 5분마다
setInterval(() => {
    sessionManager.cleanupEmptySessions();
}, CLEANUP_INTERVAL);

// 시간초: 서버 권한으로 매 세션 클럭 차감/시간패 체크
setInterval(() => {
    sessionManager.tickAllClocks(Date.now());
}, 250);
