import type { SocketEvent, SocketListener, SocketPayload } from '../interfaces/socket-event.interface';
export declare class SocketEventsService {
    private readonly events;
    private readonly usersAiSessionsStream;
    private readonly cancelledSessions;
    on(event: SocketEvent, listener: SocketListener): void;
    start(username: string, payload: SocketPayload): void;
    token(username: string, payload: SocketPayload & {
        token: string;
        message: string;
    }): void;
    end(username: string, payload: SocketPayload & {
        message: string;
    }): void;
    error(username: string, payload: SocketPayload & {
        message: string;
    }): void;
    cancel(username: string, historyId: string): void;
    collections(username: string, collections: object): void;
    history(username: string, history: object): void;
    messages(username: string, historyId: string, messages: unknown[]): void;
    newHistory(username: string, history: object): void;
    private emit;
    private emitMessages;
    private emitMessagesHistory;
    private removeSession;
    private isCancelled;
    private sessionKey;
}
