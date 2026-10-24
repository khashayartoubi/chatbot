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
exports.TransferHistoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const transfer_history_dto_1 = require("./dto/transfer-history.dto");
const transfer_history_service_1 = require("./transfer-history.service");
let TransferHistoryController = class TransferHistoryController {
    transferHistoryService;
    messages;
    constructor(transferHistoryService, messages) {
        this.transferHistoryService = transferHistoryService;
        this.messages = messages;
    }
    async transfer(dto, request) {
        const transfer = await this.transferHistoryService.transfer(dto, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate(transfer.target === 'general' ? 'conversation.movedToGeneral' : 'conversation.movedToProject'),
            data: {
                historyId: dto.historyId,
                sourceCollectionId: transfer.sourceCollectionId,
                targetCollectionId: transfer.targetCollectionId,
                target: transfer.target,
            },
        };
    }
};
exports.TransferHistoryController = TransferHistoryController;
__decorate([
    (0, common_1.Patch)('transfer-history'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.transferHistory') }),
    (0, swagger_1.ApiBody)({ type: transfer_history_dto_1.TransferHistoryDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('conversation.movedToProject') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_history_dto_1.TransferHistoryDto, Object]),
    __metadata("design:returntype", Promise)
], TransferHistoryController.prototype, "transfer", null);
exports.TransferHistoryController = TransferHistoryController = __decorate([
    (0, swagger_1.ApiTags)('Transfer History'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('transfer'),
    __metadata("design:paramtypes", [transfer_history_service_1.TransferHistoryService,
        i18n_message_service_1.I18nMessageService])
], TransferHistoryController);
//# sourceMappingURL=transfer-history.controller.js.map