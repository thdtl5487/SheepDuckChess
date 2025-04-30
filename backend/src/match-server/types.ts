// 타입 선언 (매칭 요청 유저 정보 등)
import type WS from 'ws';

export type MatchPlayer = {
    ws: WS;
    usn: number;
    nick: string;
    skinSetting: any;
};

export type UserSession = {
    ws: WS;
    usn: number;
    nick: string;
    rating: number;
    skinSetting: any;
    joinedAt: number;
    maxDiff: number; 
};
