import { ChessSession } from "./ChessSession";

export class SessionManager {
    private sessions: Map<string, ChessSession>;

    constructor() {
        this.sessions = new Map();
    }

    createSession(sessionId: string): ChessSession {
        const session = new ChessSession();
        this.sessions.set(sessionId, session);
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
}
