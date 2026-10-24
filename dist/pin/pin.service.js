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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const project_entity_1 = require("../projects/entities/project.entity");
const projects_service_1 = require("../projects/projects.service");
const chat_entity_1 = require("../stream/entities/chat.entity");
const chat_type_enum_1 = require("../stream/enums/chat-type.enum");
const socket_events_service_1 = require("../socket/services/socket-events.service");
const stream_service_1 = require("../stream/stream.service");
let PinService = class PinService {
    chatsRepository;
    projectsRepository;
    streamService;
    projectsService;
    socketEventsService;
    messages;
    constructor(chatsRepository, projectsRepository, streamService, projectsService, socketEventsService, messages) {
        this.chatsRepository = chatsRepository;
        this.projectsRepository = projectsRepository;
        this.streamService = streamService;
        this.projectsService = projectsService;
        this.socketEventsService = socketEventsService;
        this.messages = messages;
    }
    async toggle(dto, username) {
        if (!dto.historyId && !dto.collectionId) {
            throw new common_1.BadRequestException(this.messages.translate('pin.targetRequired'));
        }
        return dto.collectionId && !dto.historyId ? this.toggleProject(dto.collectionId, username) : this.toggleConversation(dto, username);
    }
    async toggleProject(collectionId, username) {
        let project;
        try {
            project = await this.projectsRepository.findOneBy({ collectionId, username });
        }
        catch {
            throw this.databaseError();
        }
        if (!project) {
            throw new common_1.NotFoundException(this.messages.translate('project.notFound'));
        }
        project.pinned = !project.pinned;
        try {
            await this.projectsRepository.save(project);
        }
        catch {
            throw this.databaseError();
        }
        await this.emitProjects(username);
        return { collectionId, pinned: project.pinned, target: 'project' };
    }
    async toggleConversation(dto, username) {
        const historyId = dto.historyId;
        const project = dto.collectionId ? await this.findProject(dto.collectionId, username) : undefined;
        let chat;
        try {
            chat = await this.chatsRepository.findOneBy({
                username,
                type: project ? chat_type_enum_1.ChatType.PROJECT : chat_type_enum_1.ChatType.GENERAL,
                projectId: project?.id ?? (0, typeorm_2.IsNull)(),
                ...(project ? { sessionId: historyId } : { historyId }),
            });
        }
        catch {
            throw this.databaseError();
        }
        if (!chat) {
            throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
        }
        chat.pinned = !chat.pinned;
        try {
            await this.chatsRepository.save(chat);
        }
        catch {
            throw this.databaseError();
        }
        if (project) {
            await this.emitProjects(username);
        }
        else {
            this.socketEventsService.history(username, await this.streamService.getHistories(username));
        }
        return {
            historyId,
            ...(dto.collectionId ? { collectionId: dto.collectionId } : {}),
            pinned: chat.pinned,
            target: 'conversation',
        };
    }
    async findProject(collectionId, username) {
        let project;
        try {
            project = await this.projectsRepository.findOneBy({ collectionId, username });
        }
        catch {
            throw this.databaseError();
        }
        if (!project) {
            throw new common_1.NotFoundException(this.messages.translate('project.notFound'));
        }
        return project;
    }
    async emitProjects(username) {
        this.socketEventsService.collections(username, await this.projectsService.getProjects(username));
    }
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
};
exports.PinService = PinService;
exports.PinService = PinService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        stream_service_1.StreamService,
        projects_service_1.ProjectsService,
        socket_events_service_1.SocketEventsService,
        i18n_message_service_1.I18nMessageService])
], PinService);
//# sourceMappingURL=pin.service.js.map