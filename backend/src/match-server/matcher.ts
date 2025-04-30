// 매칭 큐 관리
import type { WebSocket as WS } from 'ws';
import { UserSession } from './types';

const queue: UserSession[] = [];

// 큐에 유저 추가
export function addToQueue(player: UserSession) {
    console.log(`🎯 User ${player.nick} (${player.rating}) entered the queue`);
    queue.push(player);
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

                // 두 유저의 
                if (diff <= allowed1 && diff <= allowed2) {
                    // ✅ 매칭!
                    const gameId = `match_${now}`;
                    const msg1 = {
                        type: 'MATCH_FOUND',
                        payload: {
                            gameId,
                            yourColor: 'white',
                            opponentNick: p2.nick
                        }
                    };
                    const msg2 = {
                        type: 'MATCH_FOUND',
                        payload: {
                            gameId,
                            yourColor: 'black',
                            opponentNick: p1.nick
                        }
                    };

                    p1.ws.send(JSON.stringify(msg1));
                    p2.ws.send(JSON.stringify(msg2));
                    console.log(`✅ Match made: ${p1.nick}(rating: ${p1.rating}, wait: ${wait1}s, allowed1: ${allowed1}) vs ${p2.nick}(rating: ${p2.rating}, wait: ${wait2}s, allowed2: ${allowed2})`);


                    // 큐에서 제거
                    queue.splice(j, 1);
                    queue.splice(i, 1);
                    return; // 한 쌍만 처리하고 다음 tick으로
                }
            }
        }
    }, 1000); // 1초마다 반복
}

startMatchingLoop();