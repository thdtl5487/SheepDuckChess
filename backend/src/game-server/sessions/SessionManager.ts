import { ChessSession } from "./ChessSession";

export class SessionManager {
    private sessions: Map<string, ChessSession>;
    private users: Map<string, number>;

    constructor() {
        this.sessions = new Map();
        this.users = new Map();
    }

    createSession(sessionId: string, white: number, black: number): ChessSession {
        const session = new ChessSession();
        this.sessions.set(sessionId, session);

        session.setWhite(white);
        session.setBlack(black);
        session.setGameId(sessionId);
        
        return session;
    }

    getSession(sessionId: string): ChessSession | undefined {
        return this.sessions.get(sessionId);
    }

    hasSession(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    deleteSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    getAllSessionIds(): string[] {
        return Array.from(this.sessions.keys());
    }

    cleanupEmptySessions(){
        for(const [id, sess] of this.sessions){
            if((sess as any).playerSockets.size === 0){
                this.sessions.delete(id);
            }
        }
    }
}
