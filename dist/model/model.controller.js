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
exports.ModelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const model_service_1 = require("./model.service");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const set_model_dto_1 = require("./dto/set-model.dto");
let ModelController = class ModelController {
    modelService;
    messages;
    constructor(modelService, messages) {
        this.modelService = modelService;
        this.messages = messages;
    }
    async getModel() {
        const models = await this.modelService.getModels();
        return {
            success: true,
            status: 200,
            message: this.messages.translate('model.received'),
            data: models,
        };
    }
    async setModel(dto, request) {
        const updatedCount = await this.modelService.setModel(dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('model.updated'),
            data: { updatedCount },
        };
    }
};
exports.ModelController = ModelController;
__decorate([
    (0, common_1.Get)('getModel'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.model') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('model.received') }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "getModel", null);
__decorate([
    (0, common_1.Post)('setModel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.setModel') }),
    (0, swagger_1.ApiBody)({ type: set_model_dto_1.SetModelDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('model.updated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_model_dto_1.SetModelDto, Object]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "setModel", null);
exports.ModelController = ModelController = __decorate([
    (0, swagger_1.ApiTags)('Model'),
    (0, common_1.Controller)('model'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    __metadata("design:paramtypes", [model_service_1.ModelService,
        i18n_message_service_1.I18nMessageService])
], ModelController);
//# sourceMappingURL=model.controller.js.map