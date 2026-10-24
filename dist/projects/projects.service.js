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
var ProjectsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const chat_entity_1 = require("../stream/entities/chat.entity");
const stream_service_1 = require("../stream/stream.service");
const socket_events_service_1 = require("../socket/services/socket-events.service");
const uploads_service_1 = require("../uploads/uploads.service");
const project_entity_1 = require("./entities/project.entity");
let ProjectsService = ProjectsService_1 = class ProjectsService {
    projectsRepository;
    chatsRepository;
    uploadsService;
    streamService;
    socketEventsService;
    logger;
    messages;
    constructor(projectsRepository, chatsRepository, uploadsService, streamService, socketEventsService, logger, messages) {
        this.projectsRepository = projectsRepository;
        this.chatsRepository = chatsRepository;
        this.uploadsService = uploadsService;
        this.streamService = streamService;
        this.socketEventsService = socketEventsService;
        this.logger = logger;
        this.messages = messages;
    }
    async create(dto, username) {
        const { name, color, icon } = dto.collectionData;
        this.logger.info(ProjectsService_1.name, 'Project creation started', {
            username,
        });
        try {
            const project = await this.projectsRepository.save(this.projectsRepository.create({
                name: name.trim(),
                collectionId: (0, node_crypto_1.randomInt)(10_000_000_000_000, 99_999_999_999_999).toString(),
                color,
                icon,
                username,
            }));
            void this.emitCollections(username);
            this.logger.info(ProjectsService_1.name, 'Project created', {
                username,
                collectionId: project.collectionId,
            });
            return project;
        }
        catch {
            throw this.databaseError();
        }
    }
    async findAll(username, pagination) {
        try {
            return await this.projectsRepository.find({
                where: { username },
                order: { pinned: 'DESC', createdAt: 'DESC' },
                ...(pagination ? { take: pagination.limit, skip: pagination.offset } : {}),
            });
        }
        catch {
            throw this.databaseError();
        }
    }
    async getProjects(username, pagination) {
        const projects = await this.findAll(username);
        const collections = await Promise.all(projects.map(async (project) => ({
            collectionId: project.collectionId,
            collectionName: project.name,
            color: project.color,
            icon: project.icon,
            pinned: project.pinned,
            collectionGraph: {},
            collectionHistory: await this.streamService.getHistories(username, project.id, pagination),
            files: (await this.uploadsService.findAll(username, project.collectionId)).map((file) => file.fileId),
            prompt: '',
            state: 'done',
            waiting: false,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        })));
        return {
            user_name: username,
            state: 'done',
            collections,
            createdAt: collections.at(-1)?.createdAt ?? null,
            updatedAt: collections[0]?.updatedAt ?? null,
        };
    }
    async findOwnedCollection(collectionId, username) {
        let project;
        try {
            project = await this.projectsRepository.findOneBy({
                collectionId,
                username,
            });
        }
        catch {
            throw this.databaseError();
        }
        if (!project) {
            throw new common_1.NotFoundException(this.messages.translate('project.notFound'));
        }
        return project;
    }
    async getMessages(username, collectionId, historyId, pagination) {
        return this.streamService.getMessages(historyId, username, collectionId, pagination);
    }
    async updateName(collectionId, dto, username) {
        const project = await this.findOwnedCollection(collectionId, username);
        project.name = dto.collectionData.name.trim();
        try {
            const updatedProject = await this.projectsRepository.save(project);
            void this.emitCollections(username);
            this.logger.info(ProjectsService_1.name, 'Project renamed', {
                username,
                collectionId,
            });
            return updatedProject;
        }
        catch {
            throw this.databaseError();
        }
    }
    async remove(collectionId, username) {
        const project = await this.findOwnedCollection(collectionId, username);
        this.logger.info(ProjectsService_1.name, 'Project removal started', {
            username,
            collectionId,
        });
        await this.uploadsService.removeByProject(project.id);
        try {
            await this.chatsRepository.delete({
                username,
                projectId: project.id,
            });
            await this.projectsRepository.delete(project.id);
            void this.emitCollections(username);
            this.logger.info(ProjectsService_1.name, 'Project removed', {
                username,
                collectionId,
            });
        }
        catch {
            throw this.databaseError();
        }
    }
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
    async emitCollections(username) {
        try {
            this.socketEventsService.collections(username, await this.getProjects(username));
        }
        catch {
            return;
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = ProjectsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        uploads_service_1.UploadsService,
        stream_service_1.StreamService,
        socket_events_service_1.SocketEventsService,
        log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map