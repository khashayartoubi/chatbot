"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralService = void 0;
const common_1 = require("@nestjs/common");
const stream_service_1 = require("../stream/stream.service");
const socket_events_service_1 = require("../socket/services/socket-events.service");
const general_file_entity_1 = require("./entities/general-file.entity");
const general_history_entity_1 = require("./entities/general-history.entity");
let GeneralService = class GeneralService {
    streamService;
    socketEventsService;
    constructor(streamService, socketEventsService) {
        this.streamService = streamService;
        this.socketEventsService = socketEventsService;
    }
    async getHistories(username, pagination) {
        const histories = await this.streamService.getHistories(username, undefined, pagination);
        this.socketEventsService.history(username, histories);
        return histories.map((history) => Object.assign(new general_history_entity_1.GeneralHistory(), history));
    }
    async getHistoryFiles(username, historyId) {
        const files = await this.streamService.getGeneralHistoryFiles(username, historyId);
        return files.map((file) => Object.assign(new general_file_entity_1.GeneralFile(), file));
    }
    async getMessages(username, historyId, pagination) {
        return this.streamService.getMessages(historyId, username, undefined, pagination);
    }
    async editSession(dto, username) {
        const chat = await this.streamService.editSession({
            data: dto.data,
            historyId: dto.historyId,
            collectionId: null,
        }, username);
        await this.emitHistory(username);
        return chat;
    }
    async remove(historyId, username) {
        await this.streamService.remove(historyId, username);
        await this.emitHistory(username);
    }
    async removeAll(username) {
        const deletedCount = await this.streamService.removeAllGeneralHistories(username);
        await this.emitHistory(username);
        return deletedCount;
    }
    async updateMessage(dto, username) {
        const messageUpdater = this.streamService;
        await messageUpdater.updateUserMessage(dto, username);
    }
    async emitHistory(username) {
        const histories = await this.streamService.getHistories(username);
        this.socketEventsService.history(username, histories);
    }
};
exports.GeneralService = GeneralService;
exports.GeneralService = GeneralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stream_service_1.StreamService,
        socket_events_service_1.SocketEventsService])
], GeneralService);
//# sourceMappingURL=general.service.js.map