import WebSocket, { WebSocketServer } from "ws";
import { SessionManager } from "./sessions/SessionManager";

const wss = new WebSocketServer({ port: 8080 });
const sessionManager = new SessionManager();

wss.on("connection", (socket) => {
    console.log("✅ New player connected!");

    socket.on("message", (data) => {
        const msg = JSON.parse(data.toString());

        if (msg.type === "TURN_MOVE") {
            const { gameId, from, to } = msg;

            const session = sessionManager.getSession(gameId);
            if (!session) {
                socket.send(JSON.stringify({ type: "ERROR", error: "Game not found" }));
                return;
            }

            const result = session.applyMove(from, to);
            socket.send(JSON.stringify({ type: "TURN_RESULT", ...result }));

            // broadcast to other players (optional)
        }

        if (msg.type === "GAME_START") {
            const { gameId } = msg;
            if (!sessionManager.hasSession(gameId)) {
                sessionManager.createSession(gameId);
                socket.send(JSON.stringify({ type: "GAME_STARTED", gameId }));
            }
        }
    });
});
