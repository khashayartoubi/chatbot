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
exports.ModelService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const rxjs_1 = require("rxjs");
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const project_entity_1 = require("../projects/entities/project.entity");
const chat_entity_1 = require("../stream/entities/chat.entity");
const chat_type_enum_1 = require("../stream/enums/chat-type.enum");
const config_1 = require("@nestjs/config");
let ModelService = class ModelService {
    httpService;
    configService;
    chatsRepository;
    projectsRepository;
    messages;
    constructor(httpService, configService, chatsRepository, projectsRepository, messages) {
        this.httpService = httpService;
        this.configService = configService;
        this.chatsRepository = chatsRepository;
        this.projectsRepository = projectsRepository;
        this.messages = messages;
    }
    async getModels() {
        const url = this.configService.get('MODEL_SERVICE_URL');
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${url}/chat/api/model/getModel`));
        return response.data;
    }
    async setModel(dto, username) {
        const modelName = dto.modelName.trim();
        const historyId = dto.historyId?.trim() || undefined;
        const collectionId = dto.collectionId?.trim() || undefined;
        if (!historyId && !collectionId) {
            throw new common_1.BadRequestException(this.messages.translate('model.targetRequired'));
        }
        const project = collectionId ? await this.findProject(collectionId, username) : undefined;
        if (project && !historyId) {
            try {
                const result = await this.chatsRepository.update({ username, type: chat_type_enum_1.ChatType.PROJECT, projectId: project.id }, { modelName });
                return result.affected ?? 0;
            }
            catch {
                throw this.databaseError();
            }
        }
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
        chat.modelName = modelName;
        try {
            await this.chatsRepository.save(chat);
            return 1;
        }
        catch {
            throw this.databaseError();
        }
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
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
};
exports.ModelService = ModelService;
exports.ModelService = ModelService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __param(3, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        i18n_message_service_1.I18nMessageService])
], ModelService);
//# sourceMappingURL=model.service.js.map