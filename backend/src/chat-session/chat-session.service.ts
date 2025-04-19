import { Injectable, Logger } from '@nestjs/common';
// import { Message } from 'ai';

export interface Message {
  role: 'assistant' | 'user';
  content: string;
}

@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);
  private sessionStore = new Map<
    string,
    {
      history: Message[];
      lastActivity: Date;
    }
  >();

  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  constructor() {
    setInterval(() => this.cleanupSessions(), 10 * 60 * 1000);
  }
  getSessionHistory(sessionId: string): Message[] {
    this.touchSession(sessionId);
    return (
      this.sessionStore.get(sessionId)?.history ||
      this.createNewSession(sessionId).history
    );
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.touchSession(sessionId);
    session.history.push(message);
  }

  private touchSession(sessionId: string) {
    const session =
      this.sessionStore.get(sessionId) || this.createNewSession(sessionId);
    session.lastActivity = new Date();
    return session;
  }

  private createNewSession(sessionId: string) {
    const newSession = {
      history: [] as Message[],
      lastActivity: new Date(),
    };
    this.sessionStore.set(sessionId, newSession);
    return newSession;
  }

  clearSessionHistory(sessionId: string): boolean {
    try {
      this.sessionStore.delete(sessionId);
      return true;
    } catch (error) {
      this.logger.error(`Error clearing session with id ${sessionId}:`, error);
      return false;
    }
  }

  private cleanupSessions() {
    const now = new Date().getTime();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessionStore.entries()) {
      const lastActivity = session.lastActivity.getTime();
      if (now - lastActivity > this.SESSION_TIMEOUT_MS) {
        this.sessionStore.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `Cleaned up ${cleanedCount} inactive sessions. Current count: ${this.sessionStore.size}`,
      );
    }
  }
}
