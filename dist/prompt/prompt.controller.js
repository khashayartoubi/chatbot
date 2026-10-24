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
exports.PromptController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const create_prompt_dto_1 = require("./dto/create-prompt.dto");
const update_prompt_dto_1 = require("./dto/update-prompt.dto");
const prompt_service_1 = require("./prompt.service");
let PromptController = class PromptController {
    promptService;
    messages;
    constructor(promptService, messages) {
        this.promptService = promptService;
        this.messages = messages;
    }
    async create(dto, request) {
        const prompt = await this.promptService.create(request.userName, dto);
        return {
            success: true,
            status: common_1.HttpStatus.CREATED,
            message: this.messages.translate('prompt.created'),
            data: prompt,
        };
    }
    async findAll(request) {
        const prompts = await this.promptService.findAll(request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('prompt.listReceived'),
            data: prompts,
        };
    }
    async findOne(promptId, request) {
        const prompt = await this.promptService.findOne(promptId, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('prompt.received'),
            data: prompt,
        };
    }
    async update(promptId, dto, request) {
        const prompt = await this.promptService.update(promptId, request.userName, dto);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('prompt.updated'),
            data: prompt,
        };
    }
    async remove(promptId, request) {
        await this.promptService.remove(promptId, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('prompt.deleted'),
            data: [],
        };
    }
};
exports.PromptController = PromptController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.prompt.create') }),
    (0, swagger_1.ApiBody)({ type: create_prompt_dto_1.CreatePromptDto }),
    (0, swagger_1.ApiCreatedResponse)({ description: (0, swagger_message_1.swaggerMessage)('prompt.created') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_prompt_dto_1.CreatePromptDto, Object]),
    __metadata("design:returntype", Promise)
], PromptController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.prompt.list') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('prompt.listReceived') }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromptController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':promptId'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.prompt.get') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('prompt.received') }),
    __param(0, (0, common_1.Param)('promptId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':promptId'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.prompt.update') }),
    (0, swagger_1.ApiBody)({ type: update_prompt_dto_1.UpdatePromptDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('prompt.updated') }),
    __param(0, (0, common_1.Param)('promptId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_prompt_dto_1.UpdatePromptDto, Object]),
    __metadata("design:returntype", Promise)
], PromptController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':promptId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.prompt.delete') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('prompt.deleted') }),
    __param(0, (0, common_1.Param)('promptId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptController.prototype, "remove", null);
exports.PromptController = PromptController = __decorate([
    (0, swagger_1.ApiTags)('Settings - Prompts'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('settings/prompts'),
    __metadata("design:paramtypes", [prompt_service_1.PromptService,
        i18n_message_service_1.I18nMessageService])
], PromptController);
//# sourceMappingURL=prompt.controller.js.map