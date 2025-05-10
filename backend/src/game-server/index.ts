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

    socket.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "JOIN_GAME") {
            console.log(`🔗 유저 ${msg.userId} 가 ${msg.gameId} 세션에 접속 시도`);

            const session = sessionManager.getSession(msg.gameId);

            // console.log(session);
            if (!session) {
                console.log("😨바인딩 대실패 gameId : ", msg);
                socket.send(JSON.stringify({ type: "ERROR", message: "세션 없음" }));
                return;
            }

            session.bindSocket(msg.userId, socket);
            console.log(`✅ ${msg.userId} 바인딩 완료`);
        }

        if (msg.type === "TURN_MOVE") {
            console.log("메세지 왔어용!");
            const { gameId, from, to } = msg;

            const session = sessionManager.getSession(gameId);
            if (!session) {
                socket.send(JSON.stringify({ type: "ERROR", error: "Game not found" }));
                return;
            }
            session.applyMove(from, to);
        }

        if (msg.type === "GAME_START") {
            console.log("GAME START 메세지 받았음!!");
            const { gameId } = msg;
            if (!sessionManager.hasSession(gameId)) {
                console.log("GAME START 세션 생성 중 ..... ");
                sessionManager.createSession(gameId);
                socket.send(JSON.stringify({ type: "GAME_STARTED", gameId }));
            }
        }
    });
});
