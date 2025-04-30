// WebSocket 설정 및 연결 핸들링
import WebSocket, { WebSocket as WS } from 'ws';
import { addToQueue } from './matcher';
import { UserSession } from './types';

export function handleSocketConnection(ws: WS) {
    console.log('🧵 New client connected');

    let userSession: UserSession | null = null;

    ws.on('message', (message) => {
        const parsed = JSON.parse(message.toString());

        if (parsed.type === 'JOIN_QUEUE') {
            const { usn, nick, rating, skinSetting, maxDiff } = parsed.payload;

            userSession = {
                ws,
                usn,
                nick,
                rating,
                skinSetting,
                joinedAt: Date.now(),
                maxDiff : maxDiff ?? 300 // 기본값 300
            };

            addToQueue(userSession);
        }
    });

    ws.on('close', () => {
        if (userSession) {
            console.log(`❌ Disconnected - usn: ${userSession.usn}, nick: ${userSession.nick}`);
        } else {
            console.log(`❌ Disconnected - unidentified socket`);
        }
    });
}
