// 매칭 큐 관리
import { WebSocket } from 'ws';
import { UserSession } from './types';

const queue: UserSession[] = [];

// 연결이 복구되기 전까지 대기 중인 GAME_START 요청을 담아둘 큐
const pendingStarts: Array<{ gameId: string; white: number; black: number; timeControlSec: number }> = [];

// 게임서버와 연결할 WebSocket 클라이언트
let gameServerSocket: WebSocket;
let reconnectTimeout: NodeJS.Timeout | null = null;

// 1) 게임 서버에 연결 시도하는 함수 (재귀적으로 재연결)
function connectGameServer() {
    gameServerSocket = new WebSocket("ws://localhost:4002");

    gameServerSocket.on("open", () => {
        console.log("🧠 게임서버 WebSocket 연결 완료!");

        // 연결 복구되면 밀린 START 요청들 모두 전송
        while (pendingStarts.length > 0) {
            const { gameId, white, black, timeControlSec } = pendingStarts.shift()!;
            console.log("🕓 복구 후 밀린 GAME_START 전송:", gameId);
            gameServerSocket.send(JSON.stringify({ type: "GAME_START", gameId, white, black, timeControlSec }));
        }
    });

    gameServerSocket.on("error", (err) => {
        console.error("❌ 게임서버 WebSocket 에러", err);
        // 에러 나면 소켓 닫고 재연결 스케줄
        gameServerSocket.close();
    });

    gameServerSocket.on("close", (code, reason) => {
        console.warn(`🔌 게임서버 소켓 닫힘 (code=${code}, reason=${reason}). 1초 후 재연결 시도`);
        // 중복 스케줄링 방지
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectGameServer, 1000);
    });
}

// 최초 연결 시도
connectGameServer();

// 큐에 유저 추가
export function addToQueue(player: UserSession) {
    console.log(`🎯 User ${player.nick} (${player.rating}) entered the queue`);
    queue.push(player);

    console.log(`curent Queue player : `);
    queue.forEach((p) => {
        console.log(`- ${p.nick}`);
    });
    console.log("------------------");
}

export function removeToQueue(player: UserSession) {
    console.log(`😇 remove ${player.nick} from queue`)

    const index = queue.indexOf(player);
    if (index !== -1) {
        queue.splice(index, 1);
    }

    console.log(`curent Queue player : `);
    queue.forEach((p) => {
        console.log(`- ${p.nick}`);
    });
    console.log("------------------");
}

// 매 2초마다 +-20씩 허용됨
function getAllowedRange(wait: number): number {
    return 50 + Math.floor(wait / 2) * 20; // 점진 증가
}

function startMatchingLoop() {
    setInterval(() => {
        const now = Date.now();

        for (let i = 0; i < queue.length; i++) {
            const p1 = queue[i];

            for (let j = i + 1; j < queue.length; j++) {
                const p2 = queue[j];

                const wait1 = (now - p1.joinedAt) / 1000; // p1 대기 시간
                const wait2 = (now - p2.joinedAt) / 1000;

                const allowed1 = Math.min(getAllowedRange(wait1), p1.maxDiff);
                const allowed2 = Math.min(getAllowedRange(wait2), p2.maxDiff);

                const diff = Math.abs(p1.rating - p2.rating);

                const time1 = typeof p1.timeControlSec === 'number' ? p1.timeControlSec : 600;
                const time2 = typeof p2.timeControlSec === 'number' ? p2.timeControlSec : 600;

                if (diff <= allowed1 && diff <= allowed2 && time1 === time2) {
                    // ✅ 매칭!

                    // 큐에서 제거
                    queue.splice(j, 1);
                    queue.splice(i, 1);

                    console.log("p2.skinSetting : ", p2.skinSetting);

                    const gameId = `match_${now}`;
                    const msg1 = {
                        type: 'MATCH_FOUND',
                        payload: {
                            gameId,
                            yourColor: 'white',
                            opponentNick: p2.nick,
                            userSkinSetting: p1.skinSetting,
                            opponentSkinSetting: p2.skinSetting,
                            timeControlSec: time1
                        }
                    };
                    const msg2 = {
                        type: 'MATCH_FOUND',
                        payload: {
                            gameId,
                            yourColor: 'black',
                            opponentNick: p1.nick,
                            userSkinSetting: p2.skinSetting,
                            opponentSkinSetting: p1.skinSetting,
                            timeControlSec: time1
                        }
                    };

                    p1.ws.send(JSON.stringify(msg1));
                    p2.ws.send(JSON.stringify(msg2));
                    console.log(`✅ Match made: ${p1.nick}(rating: ${p1.rating}, wait: ${wait1}s, allowed1: ${allowed1}) vs ${p2.nick}(rating: ${p2.rating}, wait: ${wait2}s, allowed2: ${allowed2})`);


                    // 게임 서버에 GAME START 소켓 전송
                    if (gameServerSocket.readyState === WebSocket.OPEN) {
                        console.log("❤️❤️❤️❤️❤️게임 생성 메시지 보낸다이~~~");
                        gameServerSocket.send(JSON.stringify({
                            type: "GAME_START",
                            white: p1.usn,
                            black: p2.usn,
                            gameId: gameId,
                            timeControlSec: time1
                        }));
                    } else {
                        pendingStarts.push({ gameId, white: p1.usn, black: p2.usn, timeControlSec: time1 });
                    }


                    return; // 한 쌍만 처리하고 다음 tick으로
                }
            }
        }
    }, 1000); // 1초마다 반복
}

startMatchingLoop();