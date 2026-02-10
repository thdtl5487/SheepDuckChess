// WebSocket 설정 및 연결 핸들링
import WebSocket, { WebSocket as WS } from 'ws';
import { addToQueue, removeToQueue } from './matcher';
import { UserSession } from './types';

export function handleSocketConnection(ws: WS) {
    console.log('🧵 New client connected');

    let userSession: UserSession | null = null;

    ws.on('message', (message) => {
        const parsed = JSON.parse(message.toString());

        if (parsed.type === 'JOIN_QUEUE') {
            const { usn, nick, rating, skinSetting, maxDiff, timeControlSec } = parsed.payload;

            userSession = {
                ws,
                usn,
                nick,
                rating,
                skinSetting,
                joinedAt: Date.now(),
                maxDiff : maxDiff ?? 300, // 기본값 300
                timeControlSec: typeof timeControlSec === 'number' ? timeControlSec : 600,
            };

            addToQueue(userSession);
        }
    });

    ws.on('close', () => {
        if (userSession) {
            console.log(`❌ Disconnected - usn: ${userSession.usn}, nick: ${userSession.nick}`);
            removeToQueue(userSession);

        } else {
            console.log(`❌ Disconnected - unidentified socket`);
        }
    });
}
