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
exports.GeneralController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const update_user_message_dto_1 = require("../stream/dto/update-user-message.dto");
const edit_general_session_dto_1 = require("./dto/edit-general-session.dto");
const general_service_1 = require("./general.service");
let GeneralController = class GeneralController {
    generalService;
    messages;
    constructor(generalService, messages) {
        this.generalService = generalService;
        this.messages = messages;
    }
    async getHistory(pagination, request) {
        const histories = await this.generalService.getHistories(request.userName, pagination);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.historyReceived'),
            data: histories,
        };
    }
    async getMessages(historyId, pagination, request) {
        const messages = await this.generalService.getMessages(request.userName, historyId, pagination);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.messagesReceived'),
            data: messages,
        };
    }
    async getHistoryFiles(historyId, request) {
        const files = await this.generalService.getHistoryFiles(request.userName, historyId);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('upload.historyFilesReceived'),
            data: files,
        };
    }
    async editSession(dto, request) {
        const session = await this.generalService.editSession(dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.updated'),
            data: session,
        };
    }
    async updateMessage(dto, request) {
        await this.generalService.updateMessage(dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.messageUpdated'),
            data: {
                historyId: dto.historyId,
                messageId: dto.messageId,
            },
        };
    }
    async remove(historyId, request) {
        await this.generalService.remove(historyId, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.generalDeleted'),
            data: [],
        };
    }
    async removeAll(request) {
        const deletedCount = await this.generalService.removeAll(request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.allGeneralDeleted'),
            data: { deletedCount },
        };
    }
};
exports.GeneralController = GeneralController;
__decorate([
    (0, common_1.Get)('get-history'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.list') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.historyReceived') }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('get-messages/:historyId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.messages') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.messagesReceived') }),
    __param(0, (0, common_1.Param)('historyId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)(':historyId/files'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.files') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.historyFilesReceived') }),
    __param(0, (0, common_1.Param)('historyId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "getHistoryFiles", null);
__decorate([
    (0, common_1.Patch)('edit-session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.edit') }),
    (0, swagger_1.ApiBody)({ type: edit_general_session_dto_1.EditGeneralSessionDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.updated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [edit_general_session_dto_1.EditGeneralSessionDto, Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "editSession", null);
__decorate([
    (0, common_1.Patch)('update-message'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.updateMessage') }),
    (0, swagger_1.ApiBody)({ type: update_user_message_dto_1.UpdateUserMessageDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.messageUpdated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_user_message_dto_1.UpdateUserMessageDto, Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "updateMessage", null);
__decorate([
    (0, common_1.Delete)('delete-history/:historyId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.delete') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.generalDeleted') }),
    __param(0, (0, common_1.Param)('historyId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('delete-history'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.general.deleteAll') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.allGeneralDeleted') }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GeneralController.prototype, "removeAll", null);
exports.GeneralController = GeneralController = __decorate([
    (0, swagger_1.ApiTags)('General'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('general'),
    __metadata("design:paramtypes", [general_service_1.GeneralService,
        i18n_message_service_1.I18nMessageService])
], GeneralController);
//# sourceMappingURL=general.controller.js.map