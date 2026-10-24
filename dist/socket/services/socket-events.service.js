"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEventsService = void 0;
const common_1 = require("@nestjs/common");
const node_events_1 = require("node:events");
let SocketEventsService = class SocketEventsService {
    events = new node_events_1.EventEmitter();
    usersAiSessionsStream = {};
    cancelledSessions = new Set();
    on(event, listener) {
        this.events.on(event, listener);
    }
    start(username, payload) {
        this.cancelledSessions.delete(this.sessionKey(username, payload.historyId));
        this.emit(username, 'aiAssistantMessageStart', payload);
        this.emitMessages(username, payload);
    }
    token(username, payload) {
        if (this.isCancelled(username, payload.historyId)) {
            return;
        }
        this.emitMessages(username, payload);
    }
    end(username, payload) {
        if (this.isCancelled(username, payload.historyId)) {
            return;
        }
        this.emit(username, 'aiAssistantMessageEnd', payload);
        this.emitMessages(username, payload);
        this.removeSession(username, payload.historyId);
        this.emit(username, 'aiAssistantMessageHistory', {});
    }
    error(username, payload) {
        if (this.isCancelled(username, payload.historyId)) {
            return;
        }
        this.emit(username, 'aiAssistantMessageError', payload);
        this.emitMessages(username, payload);
    }
    cancel(username, historyId) {
        this.cancelledSessions.add(this.sessionKey(username, historyId));
        this.removeSession(username, historyId);
        this.emitMessagesHistory(username);
    }
    collections(username, collections) {
        this.emit(username, 'aiCollections', collections);
    }
    history(username, history) {
        this.emit(username, 'aiHistory', history);
    }
    messages(username, historyId, messages) {
        const payload = { [historyId]: messages };
        this.emit(username, 'aiAssistantMessage', payload);
        this.emit(username, 'aiAssistantMessageHistory', payload);
    }
    newHistory(username, history) {
        this.emit(username, 'aiNewHistory', history);
    }
    emit(username, event, payload) {
        this.events.emit(event, username, payload);
    }
    emitMessages(username, payload) {
        this.usersAiSessionsStream[username] ??= {};
        this.usersAiSessionsStream[username][payload.historyId] = payload.messages ?? [];
        this.emitMessagesHistory(username);
    }
    emitMessagesHistory(username) {
        const history = this.usersAiSessionsStream[username] ?? {};
        this.emit(username, 'aiAssistantMessage', history);
        this.emit(username, 'aiAssistantMessageHistory', history);
    }
    removeSession(username, historyId) {
        if (!this.usersAiSessionsStream[username]) {
            return;
        }
        delete this.usersAiSessionsStream[username][historyId];
        if (!Object.keys(this.usersAiSessionsStream[username]).length) {
            delete this.usersAiSessionsStream[username];
        }
    }
    isCancelled(username, historyId) {
        return this.cancelledSessions.has(this.sessionKey(username, historyId));
    }
    sessionKey(username, historyId) {
        return `${username}:${historyId}`;
    }
};
exports.SocketEventsService = SocketEventsService;
exports.SocketEventsService = SocketEventsService = __decorate([
    (0, common_1.Injectable)()
], SocketEventsService);
//# sourceMappingURL=socket-events.service.js.map