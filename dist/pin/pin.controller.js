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
exports.PinController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const pin_session_dto_1 = require("./dto/pin-session.dto");
const pin_service_1 = require("./pin.service");
let PinController = class PinController {
    pinService;
    messages;
    constructor(pinService, messages) {
        this.pinService = pinService;
        this.messages = messages;
    }
    async pin(dto, request) {
        const result = await this.pinService.toggle(dto, request.userName);
        const messageKey = result.target === 'project' ? (result.pinned ? 'project.pinned' : 'project.unpinned') : result.pinned ? 'conversation.pinned' : 'conversation.unpinned';
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate(messageKey),
            data: result,
        };
    }
};
exports.PinController = PinController;
__decorate([
    (0, common_1.Patch)('pin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.pin') }),
    (0, swagger_1.ApiBody)({ type: pin_session_dto_1.PinSessionDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.pinChanged') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pin_session_dto_1.PinSessionDto, Object]),
    __metadata("design:returntype", Promise)
], PinController.prototype, "pin", null);
exports.PinController = PinController = __decorate([
    (0, swagger_1.ApiTags)('Pin'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [pin_service_1.PinService,
        i18n_message_service_1.I18nMessageService])
], PinController);
//# sourceMappingURL=pin.controller.js.map