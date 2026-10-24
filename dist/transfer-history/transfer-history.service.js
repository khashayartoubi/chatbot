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
exports.TransferHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const projects_service_1 = require("../projects/projects.service");
const project_entity_1 = require("../projects/entities/project.entity");
const chat_entity_1 = require("../stream/entities/chat.entity");
const chat_type_enum_1 = require("../stream/enums/chat-type.enum");
const socket_events_service_1 = require("../socket/services/socket-events.service");
const stream_service_1 = require("../stream/stream.service");
const upload_entity_1 = require("../uploads/entities/upload.entity");
let TransferHistoryService = class TransferHistoryService {
    dataSource;
    streamService;
    projectsService;
    socketEventsService;
    messages;
    constructor(dataSource, streamService, projectsService, socketEventsService, messages) {
        this.dataSource = dataSource;
        this.streamService = streamService;
        this.projectsService = projectsService;
        this.socketEventsService = socketEventsService;
        this.messages = messages;
    }
    async transfer(dto, username) {
        const sourceCollectionId = dto.sourceCollectionId.trim() || undefined;
        const targetCollectionId = dto.targetCollectionId.trim() || undefined;
        const movesToGeneral = Boolean(sourceCollectionId && !targetCollectionId);
        if (!sourceCollectionId && !targetCollectionId) {
            throw new common_1.BadRequestException(this.messages.translate('conversation.transferScopeRequired'));
        }
        if (sourceCollectionId === targetCollectionId) {
            throw new common_1.ConflictException(this.messages.translate('conversation.sameProjectTransfer'));
        }
        try {
            await this.dataSource.transaction(async (manager) => {
                const projectsRepository = manager.getRepository(project_entity_1.Project);
                const targetProject = targetCollectionId ? await projectsRepository.findOneBy({ collectionId: targetCollectionId, username }) : undefined;
                if (targetCollectionId && !targetProject) {
                    throw new common_1.NotFoundException(this.messages.translate('project.targetNotFound'));
                }
                const sourceProject = sourceCollectionId ? await projectsRepository.findOneBy({ collectionId: sourceCollectionId, username }) : undefined;
                if (sourceCollectionId && !sourceProject) {
                    throw new common_1.NotFoundException(this.messages.translate('project.sourceNotFound'));
                }
                const sourceProjectId = sourceProject?.id;
                const chat = await manager.getRepository(chat_entity_1.Chat).findOneBy({
                    username,
                    type: sourceProjectId ? chat_type_enum_1.ChatType.PROJECT : chat_type_enum_1.ChatType.GENERAL,
                    projectId: sourceProjectId ?? (0, typeorm_1.IsNull)(),
                    ...(sourceProjectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
                });
                if (!chat) {
                    throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
                }
                const targetConversation = await manager.getRepository(chat_entity_1.Chat).findOneBy({
                    username,
                    type: movesToGeneral ? chat_type_enum_1.ChatType.GENERAL : chat_type_enum_1.ChatType.PROJECT,
                    projectId: targetProject?.id ?? (0, typeorm_1.IsNull)(),
                    ...(movesToGeneral ? { historyId: dto.historyId } : { sessionId: dto.historyId }),
                });
                if (targetConversation) {
                    throw new common_1.ConflictException(this.messages.translate('conversation.targetHistoryExists'));
                }
                if (movesToGeneral) {
                    await manager.getRepository(chat_entity_1.Chat).update(chat.id, {
                        type: chat_type_enum_1.ChatType.GENERAL,
                        projectId: () => 'NULL',
                        sessionId: () => 'NULL',
                        historyId: dto.historyId,
                    });
                }
                else {
                    chat.type = chat_type_enum_1.ChatType.PROJECT;
                    chat.projectId = targetProject.id;
                    chat.sessionId = dto.historyId;
                    chat.historyId = undefined;
                    await manager.getRepository(chat_entity_1.Chat).save(chat);
                }
                await manager.getRepository(upload_entity_1.Upload).update({
                    username,
                    projectId: sourceProjectId ?? (0, typeorm_1.IsNull)(),
                    ...(sourceProjectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
                }, {
                    ...(movesToGeneral
                        ? {
                            projectId: () => 'NULL',
                            sessionId: () => 'NULL',
                            historyId: dto.historyId,
                        }
                        : {
                            projectId: targetProject.id,
                            sessionId: dto.historyId,
                            historyId: () => 'NULL',
                        }),
                });
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        const [generalHistories, projects] = await Promise.all([this.streamService.getHistories(username), this.projectsService.getProjects(username)]);
        this.socketEventsService.history(username, generalHistories);
        this.socketEventsService.collections(username, projects);
        return {
            sourceCollectionId: sourceCollectionId ?? '',
            targetCollectionId: targetCollectionId ?? '',
            target: movesToGeneral ? 'general' : 'project',
        };
    }
};
exports.TransferHistoryService = TransferHistoryService;
exports.TransferHistoryService = TransferHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        stream_service_1.StreamService,
        projects_service_1.ProjectsService,
        socket_events_service_1.SocketEventsService,
        i18n_message_service_1.I18nMessageService])
], TransferHistoryService);
//# sourceMappingURL=transfer-history.service.js.map