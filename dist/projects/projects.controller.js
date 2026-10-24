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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const edit_session_dto_1 = require("../stream/dto/edit-session.dto");
const update_user_message_dto_1 = require("../stream/dto/update-user-message.dto");
const stream_service_1 = require("../stream/stream.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const update_project_dto_1 = require("./dto/update-project.dto");
const projects_service_1 = require("./projects.service");
let ProjectsController = class ProjectsController {
    projectsService;
    streamService;
    messages;
    constructor(projectsService, streamService, messages) {
        this.projectsService = projectsService;
        this.streamService = streamService;
        this.messages = messages;
    }
    async create(dto, request) {
        const project = await this.projectsService.create(dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.CREATED,
            message: this.messages.translate('project.created'),
            data: {
                collectionId: project.collectionId,
                collectionName: project.name,
                collectionGraph: {},
                collectionHistory: [],
                createdAt: project.createdAt,
                prompt: '',
                state: 'done',
                waiting: false,
            },
        };
    }
    async findAll(pagination, request) {
        const projects = await this.projectsService.findAll(request.userName, pagination);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('project.listReceived'),
            data: projects,
        };
    }
    async getCollection(pagination, request) {
        const projects = await this.projectsService.getProjects(request.userName, pagination);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('project.received'),
            data: projects,
        };
    }
    async getMessages(collectionId, historyId, pagination, request) {
        const messages = await this.projectsService.getMessages(request.userName, collectionId, historyId, pagination);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.messagesReceived'),
            data: messages,
        };
    }
    async updateName(dto, request) {
        const project = await this.projectsService.updateName(dto.collectionId, dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('project.renamed'),
            data: {
                collectionId: project.collectionId,
                collectionName: project.name,
            },
        };
    }
    async editSession(dto, request) {
        if (!dto.collectionId) {
            throw new common_1.BadRequestException(this.messages.translate('project.idRequired'));
        }
        const session = await this.streamService.editSession(dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.updated'),
            data: session,
        };
    }
    async updateMessage(dto, request) {
        await this.streamService.updateUserMessage(dto, request.userName, dto.collectionId);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.messageUpdated'),
            data: {
                collectionId: dto.collectionId,
                historyId: dto.historyId,
                messageId: dto.messageId,
            },
        };
    }
    async removeHistory(collectionId, historyId, request) {
        await this.streamService.remove(historyId, request.userName, collectionId);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.projectDeleted'),
            data: [],
        };
    }
    async remove(collectionId, request) {
        await this.projectsService.remove(collectionId, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('project.deleted'),
            data: [],
        };
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)('create-collection'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.create') }),
    (0, swagger_1.ApiBody)({ type: create_project_dto_1.CreateProjectDto }),
    (0, swagger_1.ApiCreatedResponse)({ description: (0, swagger_message_1.swaggerMessage)('project.created') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.list') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('project.listReceived') }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('get-collection'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.details') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('project.listReceived') }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getCollection", null);
__decorate([
    (0, common_1.Get)(':collectionId/get-messages/:historyId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.messages') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.messagesReceived') }),
    __param(0, (0, common_1.Param)('collectionId')),
    __param(1, (0, common_1.Param)('historyId')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, pagination_query_dto_1.PaginationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Patch)('edit-collection'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.rename') }),
    (0, swagger_1.ApiBody)({ type: update_project_dto_1.UpdateProjectDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('project.renamed') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_project_dto_1.UpdateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "updateName", null);
__decorate([
    (0, common_1.Patch)('edit-session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.editConversation') }),
    (0, swagger_1.ApiBody)({ type: edit_session_dto_1.EditSessionDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.updated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [edit_session_dto_1.EditSessionDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "editSession", null);
__decorate([
    (0, common_1.Patch)('update-message'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.updateMessage') }),
    (0, swagger_1.ApiBody)({ type: update_user_message_dto_1.UpdateProjectUserMessageDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.messageUpdated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_user_message_dto_1.UpdateProjectUserMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "updateMessage", null);
__decorate([
    (0, common_1.Delete)(':collectionId/history/:historyId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.deleteConversation') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.projectDeleted') }),
    __param(0, (0, common_1.Param)('collectionId')),
    __param(1, (0, common_1.Param)('historyId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "removeHistory", null);
__decorate([
    (0, common_1.Delete)(':collectionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.project.delete') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('project.deleted') }),
    __param(0, (0, common_1.Param)('collectionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "remove", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, swagger_1.ApiTags)('Projects'),
    (0, common_1.Controller)('collection'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        stream_service_1.StreamService,
        i18n_message_service_1.I18nMessageService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map