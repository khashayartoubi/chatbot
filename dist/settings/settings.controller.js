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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const update_settings_dto_1 = require("./dto/update-settings.dto");
const settings_service_1 = require("./settings.service");
let SettingsController = class SettingsController {
    settingsService;
    messages;
    constructor(settingsService, messages) {
        this.settingsService = settingsService;
        this.messages = messages;
    }
    async get(request) {
        const settings = await this.settingsService.get(request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('settings.received'),
            data: settings,
        };
    }
    async update(dto, request) {
        const settings = await this.settingsService.update(request.userName, dto);
        this.messages.setLanguage(settings.defaultLanguage);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('settings.updated'),
            data: settings,
        };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.settings.get') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('settings.received') }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.settings.update') }),
    (0, swagger_1.ApiBody)({ type: update_settings_dto_1.UpdateSettingsDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('settings.updated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_settings_dto_1.UpdateSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "update", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        i18n_message_service_1.I18nMessageService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map