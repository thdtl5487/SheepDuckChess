// ChessSession.ts
import { Piece, PieceType } from "../types/pieces";
import {
    initialBoard,
    isValidMove,
    isKingInCheck,
    isCheckmate,
    isStalemate,
    isInsufficientMaterial,
    promote,
    isCastlingMove,
} from "../core/ChessRules";
import { formatMoveLog } from "../utils/formatMoveLog";
import * as ws from "ws"; // <- 정확히 이걸로 불러와야 함
import axios from "axios";
import dotenv from 'dotenv';

// 체스 오프닝 데이터 불러오기 (ISC 라이센스 표기 필쑤)
type RawOpening = {
    name: string;
    eco: string;
    pgn: string;
    fen: string;
};

// 2) Book만 뽑아오기
const { Book: rawBook } = require("@mychess/openings") as {
    Book: Record<string, RawOpening>;
};

// 3) 객체 → 튜플 배열로 캐스트
const entries = Object.entries(rawBook) as [string, RawOpening][];

// 4) PGN → SAN 수열 파싱 함수
function pgnToMoves(pgn: string): string[] {
    return pgn
        .replace(/\d+\./g, "")   // "1.e4" → "e4"
        .trim()
        .split(/\s+/);           // ["e4","e5", …]
}

// 5) 튜플 배열 → 패턴 배열
type Pattern = { name: string; eco: string; moves: string[] };
const allPatterns: Pattern[] = entries.map(([eco, o]) => ({
    name: o.name,
    eco,
    moves: pgnToMoves(o.pgn),
}));

// 6) 오프닝 vs 디펜스 분리
const openingPatterns = allPatterns.filter(o => !/defen[cs]e/i.test(o.name));
const defencePatterns = allPatterns.filter(o => /defen[cs]e/i.test(o.name));

console.log("오프닝 패턴 : ", openingPatterns.length);
console.log("디펜스 패턴 :", defencePatterns.length);

dotenv.config();

const apiPort = process.env.PORT_API ?? '4000';
const host = (process.env.IS_JARANG === 'true' ? process.env.JARANG_HOST : process.env.TEST_HOST) ?? 'localhost';


export class ChessSession {
    private white: number;
    private black: number;
    private gameId: string;
    private pieces: Piece[];
    private turn: "white" | "black";
    private moved: { [pos: string]: boolean };
    private logs: string[];
    private enPassantTarget: string | null;
    private result: "ongoing" | "white_win" | "black_win" | "draw";
    private playerSockets: Map<string, ws.WebSocket> = new Map();
    private lastMove: { from: string; to: string; pieceType: string } | null = null;

    private initialTimeMs: number;
    private whiteMs: number;
    private blackMs: number;
    private clockLastTs: number;
    private lastClockBroadcastSec: number;

    constructor(initialTimeSec: number = 600) {
        this.white = 0;
        this.black = 0;
        this.gameId = "";
        this.pieces = [...initialBoard];
        this.turn = "white";
        this.logs = [];
        this.moved = {};
        this.enPassantTarget = null;
        this.result = "ongoing";
        this.lastMove = null;

        this.initialTimeMs = Math.max(1, Math.floor(initialTimeSec)) * 1000;
        this.whiteMs = this.initialTimeMs;
        this.blackMs = this.initialTimeMs;
        this.clockLastTs = Date.now();
        this.lastClockBroadcastSec = Math.floor(this.clockLastTs / 1000);
    }

    private getClocksPayload(now: number) {
        return {
            initialMs: this.initialTimeMs,
            whiteMs: this.whiteMs,
            blackMs: this.blackMs,
            turn: this.turn,
            serverNow: now,
        };
    }

    tickClocks(now: number = Date.now()) {
        if (this.result !== "ongoing") return;

        const dt = Math.max(0, now - this.clockLastTs);
        this.clockLastTs = now;

        if (this.turn === "white") this.whiteMs = Math.max(0, this.whiteMs - dt);
        else this.blackMs = Math.max(0, this.blackMs - dt);

        if (this.whiteMs <= 0 || this.blackMs <= 0) {
            this.result = this.whiteMs <= 0 ? "black_win" : "white_win";
            this.broadcast({
                type: "GAME_OVER",
                result: this.result,
                winner: this.result === "white_win" ? "white" : "black",
                reason: "timeout",
            });

            // 타임오버도 게임 종료이므로 로그 저장
            // (체크메이트/무승부 경로에서는 applyMove에서 저장하고, 타임오버는 여기서만 발생)
            this.saveLog().catch(console.error);
            return;
        }

        const sec = Math.floor(now / 1000);
        if (sec !== this.lastClockBroadcastSec) {
            this.lastClockBroadcastSec = sec;
            this.broadcast({
                type: "CLOCK_SYNC",
                clocks: this.getClocksPayload(now),
            });
        }
    }

    // 검출 플래그 & 최대 패턴 길이
    private openingDetected = false;
    private defenceDetected = false;
    private maxOpeningLen = 14;
    private maxDefenceLen = 14;



    hasUser(userId: string) {
        if (this.playerSockets.get(userId)) {
            return true;
        } else {
            return false;
        }
    }

    unbindSocket(userId: string) {
        this.playerSockets.delete(userId);
    }


    getWhite() {
        return this.white;
    }

    getBlack() {
        return this.black;
    }

    getGameId() {
        return this.gameId;
    }

    setWhite(usn: number) {
        this.white = usn;
    }

    setBlack(usn: number) {
        this.black = usn;
    }

    setGameId(id: string) {
        this.gameId = id;
    }

    bindSocket(userId: string, socket: ws.WebSocket) {
        const alreadyConnected = this.playerSockets.has(userId);
        this.playerSockets.set(userId, socket);

        this.broadcast({
            type: "OPPONENT_RECONNECTED",
        })

        // (재)접속 시점마다 재접속한 소켓에 현재 보드 상태만 보내 줌
        const now = Date.now();
        const initState = {
            type: "TURN_RESULT",      // 기존 TURN_RESULT 로 통일
            board: this.pieces,        // current board array
            turn: this.turn,          // 현재 턴
            logs: this.logs,          // 지금까지의 move log
            lastMove: this.lastMove,               // 초기 상태엔 마지막 수 없으니 null
            captured: false,              // 캡처 이벤트 아님
            clocks: this.getClocksPayload(now)
        };
        console.log('initState : ',initState);
        socket.send(JSON.stringify(initState));

        socket.on("close", () => {
            this.playerSockets.delete(userId);
            this.broadcast({
                type: "OPPONENT_DISCONNECTED",
                userId,
            });
        });

        console.log(`❤️소켓 바인딩 성공 userId : ${userId}`)
    }

    broadcast(data: any) {
        const message = JSON.stringify(data);
        this.playerSockets.forEach((socket) => {
            socket.send(message);
        });
    }

    getGameState() {
        return {
            board: this.pieces,
            turn: this.turn,
            logs: this.logs,
            result: this.result,
        };
    }

    applyMove(from: string, to: string, promotion: PieceType | null = null): { success: boolean; log?: string } {
        if (this.result !== "ongoing") return { success: false };

        // 서버 권한 시간 차감(현재 턴 플레이어의 시간)
        this.tickClocks(Date.now());
        if (this.result !== "ongoing") return { success: false };

        const piece = this.pieces.find(p => p.position === from);
        if (!piece || piece.color !== this.turn) return { success: false };

        if (!isValidMove(from, to, piece.type, piece.color, this.pieces, this.moved, this.enPassantTarget)) {
            return { success: false };
        }

        // 캐슬링
        const castling = isCastlingMove(from, to, piece.type, piece.color, this.pieces, this.moved);
        console.log("isCastling? : ", castling)

        if (castling) {

            // 캐슬링은 체크 상태에서 불가 + 캐슬링 후에도 자기 킹이 체크면 불가
            if (isKingInCheck(this.turn, this.pieces)) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('❌ illegal castling while in check', { from, to, turn: this.turn });
                }
                return { success: false };
            }

            const rookSim = this.pieces.find(p => p.position === castling.rookFrom);
            const simulatedPieces = this.pieces
                .filter(p => p.position !== from && p.position !== castling.rookFrom)
                .concat({ ...piece, position: to })
                .concat(rookSim ? [{ ...rookSim, position: castling.rookTo }] : []);

            if (isKingInCheck(this.turn, simulatedPieces)) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('❌ illegal move (self-check) - castling', { from, to, turn: this.turn });
                }
                return { success: false };
            }

            // 필터링 전 rook 객체 미리 저장장
            const rook = this.pieces.find(p => p.position === castling.rookFrom);

            // 캐슬링 처리: 킹, 룩 기존 위치에서 제거거
            this.pieces = this.pieces.filter(p =>
                p.position !== from && p.position !== castling.rookFrom
            );

            // 킹 우선 이동
            this.pieces.push({ ...piece, position: to });

            // 룩 이동
            if (rook) {
                this.pieces.push({ ...rook, position: castling.rookTo });
            }

            this.moved[from] = true;
            this.moved[castling.rookFrom] = true;

            // log 생성 + 턴 전환 + 체크메이트 판정 등 동일
            const nextTurn = this.turn === "white" ? "black" : "white";
            const check = isKingInCheck(nextTurn, this.pieces);
            const mate = isCheckmate(nextTurn, this.pieces, this.moved, this.enPassantTarget);
            const log = formatMoveLog(piece, from, to, this.pieces, check, mate, undefined, to === "g1" || to === "g8" ? "O-O" : "O-O-O");

            if (check && process.env.NODE_ENV !== 'production') {
                console.log('✅ CHECK', { attacker: this.turn, defender: nextTurn, from, to });
            }

            if (mate) {
                this.result = this.turn === "white" ? "white_win" : "black_win";
            } else if (isStalemate(nextTurn, this.pieces, this.moved, this.enPassantTarget) || isInsufficientMaterial(this.pieces)) {
                this.result = "draw";
            }
            this.logs.push(log);

            if (this.result !== "ongoing") {
                this.broadcast({
                    type: "GAME_OVER",
                    result: this.result,
                    winner: this.result === "draw" ? undefined : this.result === "white_win" ? "white" : "black",
                    reason: mate ? "checkmate" : "draw",
                });
                console.log(this.logs);
                this.saveLog().catch(console.error);
            }

            this.turn = nextTurn;
            this.clockLastTs = Date.now();
            console.log(`from : ${from}, to : ${to}`)
            this.broadcast({
                type: "TURN_RESULT",
                log,
                board: this.pieces,
                turn: this.turn,
                lastMove: {
                    from: from,
                    to: to,
                    pieceType: piece.type
                },
                isCaptured: false,
                clocks: this.getClocksPayload(Date.now())
            });
            this.lastMove = { from, to, pieceType: piece.type };
            return { success: true, log };
        } else {
            const target = this.pieces.find(p => p.position === to);
            const isCapture = !!target;

            // 자기 킹이 체크 상태가 되는 수는 금지(앙파상/프로모션 포함)
            const isEnPassant = piece.type === "pawn" && to === this.enPassantTarget;
            const capturedEnPassantPos = (() => {
                if (!isEnPassant) return null;
                const rank = piece.color === "white" ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
                return `${to[0]}${rank}`;
            })();

            const promotedType = (piece.type === "pawn" && (to[1] === "8" || to[1] === "1") && promotion)
                ? promote(piece, promotion).type
                : piece.type;

            const simulatedPieces = this.pieces
                .filter(p => p.position !== from && p.position !== to && (!capturedEnPassantPos || p.position !== capturedEnPassantPos))
                .concat({ ...piece, type: promotedType, position: to });

            if (isKingInCheck(this.turn, simulatedPieces)) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('❌ illegal move (self-check)', { from, to, turn: this.turn });
                }
                return { success: false };
            }

            // 앙파상
            if (piece.type === "pawn" && to === this.enPassantTarget) {
                const rank = piece.color === "white" ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
                const captured = `${to[0]}${rank}`;
                this.pieces = this.pieces.filter(p => p.position !== from && p.position !== captured);
            } else {
                this.pieces = this.pieces.filter(p => p.position !== from && p.position !== to);
            }

            console.log("Promotion 타겟 기물 : ", promotion);

            // 프로모션
            const promoted = (piece.type === "pawn" && (to[1] === "8" || to[1] === "1"))
                ? promote(piece, promotion!) // TODO: 사용자 선택으로 변경
                : { ...piece };

            promoted.position = to;
            this.pieces.push(promoted);

            // 앙파상 조건 감지
            if (piece.type === "pawn" && Math.abs(parseInt(from[1]) - parseInt(to[1])) === 2) {
                const mid = (parseInt(from[1]) + parseInt(to[1])) / 2;
                this.enPassantTarget = `${from[0]}${mid}`;
            } else {
                this.enPassantTarget = null;
            }

            this.moved[from] = true;

            // 체크/메이트/무승부 감지
            const nextTurn = this.turn === "white" ? "black" : "white";
            const board = this.pieces;

            const check = isKingInCheck(nextTurn, board);
            const mate = isCheckmate(nextTurn, board, this.moved, this.enPassantTarget);
            const draw = isStalemate(nextTurn, board, this.moved, this.enPassantTarget) || isInsufficientMaterial(board);
            const log = formatMoveLog(piece, from, to, board, check, mate);

            if (check && process.env.NODE_ENV !== 'production') {
                console.log('✅ CHECK', { attacker: this.turn, defender: nextTurn, from, to });
            }

            // console.log("piece : ", piece);

            this.logs.push(log);

            if (mate) {
                this.result = this.turn === "white" ? "white_win" : "black_win";
            } else if (isStalemate(nextTurn, this.pieces, this.moved, this.enPassantTarget) || isInsufficientMaterial(this.pieces)) {
                this.result = "draw";
            }

            if (this.result !== "ongoing") {
                this.broadcast({
                    type: "GAME_OVER",
                    result: this.result,                               // "white_win" | "black_win" | "draw"
                    winner: this.result === "draw" ? undefined : this.result === "white_win" ? "white" : "black"
                });
                console.log(this.logs);
                this.saveLog().catch(console.error);
            }

            // console.log(`from : ${from}, to : ${to}`);
            this.broadcast({
                type: "TURN_RESULT",
                log,
                board: this.pieces,
                turn: this.turn === "white" ? "black" : "white",
                lastMove: {
                    from: from,
                    to: to,
                    pieceType: piece.type
                },
                isCapture: isCapture,
                attacker: piece.type,
                victim: target?.type,
                enPassantTarget: this.enPassantTarget,
                clocks: this.getClocksPayload(Date.now())
            });

            this.lastMove = { from, to, pieceType: piece.type };

            this.detectOpeningAndDefence();

            this.turn = nextTurn;
            this.clockLastTs = Date.now();

            return { success: true, log };
        }
    }

    // 오프닝/디펜스 검출 기능
    private detectOpeningAndDefence() {
        const sanMoves = this.logs.map(l => l.split(" ")[0]);
        console.log(sanMoves);
        const ply = sanMoves.length;

        // Opening
        if (!this.openingDetected) {
            if (ply > this.maxOpeningLen) {
                this.openingDetected = true;
            } else {
                const match = openingPatterns.find(o =>
                    o.moves.length >= ply &&
                    o.moves.slice(0, ply).join(",") === sanMoves.join(",")
                );
                if (match) {
                    console.log("오프닝 발생!!!! : ", match.name);
                    this.openingDetected = true;
                    this.broadcast({
                        type: "OPENING_DETECTED",
                        openingName: match.name,
                        ecoCode: match.eco,
                    });
                }
            }
        }

        // Defence (짝수수 이후)
        if (!this.defenceDetected && ply >= 2 && ply % 2 === 0) {
            if (ply > this.maxDefenceLen) {
                this.defenceDetected = true;
            } else {
                const matchD = defencePatterns.find(o =>
                    o.moves.length >= ply &&
                    o.moves.slice(0, ply).join(",") === sanMoves.join(",")
                );
                if (matchD) {
                    this.defenceDetected = true;
                    console.log("디펜스 발생!!!! : ", matchD.name);
                    this.broadcast({
                        type: "DEFENCE_DETECTED",
                        defenceName: matchD.name,
                        ecoCode: matchD.eco,
                    });
                }
            }
        }
    }

    private async saveLog() {
        const url = `http://${host}:${apiPort}/game/insertLogs`;
        try {
            await axios.post(
                url,
                {
                    game_serial_number: this.gameId,
                    white_player: this.white,
                    black_player: this.black,
                    win: this.result,            // "white_win" | "black_win" | "draw"
                    game_log: this.logs,
                    game_date: new Date().toISOString(),
                },
                {
                    timeout: 5000,
                }
            );
        } catch (err: any) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            console.error('❌ saveLog failed', { url, status, data, message: err?.message });
            throw err;
        }
    }
}
