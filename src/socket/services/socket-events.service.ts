import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { SocketEvent, SocketListener, SocketPayload } from '../interfaces/socket-event.interface';

@Injectable()
export class SocketEventsService {
  private readonly events = new EventEmitter();
  private readonly usersAiSessionsStream: Record<string, Record<string, unknown[]>> = {};
  private readonly cancelledSessions = new Set<string>();

  on(event: SocketEvent, listener: SocketListener): void {
    this.events.on(event, listener);
  }

  start(username: string, payload: SocketPayload): void {
    this.cancelledSessions.delete(this.sessionKey(username, payload.historyId));
    this.emit(username, 'aiAssistantMessageStart', payload);
    this.emitMessages(username, payload);
  }

  token(username: string, payload: SocketPayload & { token: string; message: string }): void {
    if (this.isCancelled(username, payload.historyId)) {
      return;
    }
    this.emitMessages(username, payload);
  }

  end(username: string, payload: SocketPayload & { message: string }): void {
    if (this.isCancelled(username, payload.historyId)) {
      return;
    }
    this.emit(username, 'aiAssistantMessageEnd', payload);
    this.emitMessages(username, payload);
    this.removeSession(username, payload.historyId);
    this.emit(username, 'aiAssistantMessageHistory', {});
  }

  error(username: string, payload: SocketPayload & { message: string }): void {
    if (this.isCancelled(username, payload.historyId)) {
      return;
    }
    this.emit(username, 'aiAssistantMessageError', payload);
    this.emitMessages(username, payload);
  }

  cancel(username: string, historyId: string): void {
    this.cancelledSessions.add(this.sessionKey(username, historyId));
    this.removeSession(username, historyId);
    this.emitMessagesHistory(username);
  }

  collections(username: string, collections: object): void {
    this.emit(username, 'aiCollections', collections);
  }

  history(username: string, history: object): void {
    this.emit(username, 'aiHistory', history);
  }

  messages(username: string, historyId: string, messages: unknown[]): void {
    const payload = { [historyId]: messages };
    this.emit(username, 'aiAssistantMessage', payload);
    this.emit(username, 'aiAssistantMessageHistory', payload);
  }

  newHistory(username: string, history: object): void {
    this.emit(username, 'aiNewHistory', history);
  }

  private emit(username: string, event: SocketEvent, payload: object): void {
    this.events.emit(event, username, payload);
  }

  private emitMessages(username: string, payload: SocketPayload): void {
    this.usersAiSessionsStream[username] ??= {};
    this.usersAiSessionsStream[username][payload.historyId] = payload.messages ?? [];
    this.emitMessagesHistory(username);
  }

  private emitMessagesHistory(username: string): void {
    const history = this.usersAiSessionsStream[username] ?? {};
    this.emit(username, 'aiAssistantMessage', history);
    this.emit(username, 'aiAssistantMessageHistory', history);
  }

  private removeSession(username: string, historyId: string): void {
    if (!this.usersAiSessionsStream[username]) {
      return;
    }
    delete this.usersAiSessionsStream[username][historyId];
    if (!Object.keys(this.usersAiSessionsStream[username]).length) {
      delete this.usersAiSessionsStream[username];
    }
  }

  private isCancelled(username: string, historyId: string): boolean {
    return this.cancelledSessions.has(this.sessionKey(username, historyId));
  }

  private sessionKey(username: string, historyId: string): string {
    return `${username}:${historyId}`;
  }
}
