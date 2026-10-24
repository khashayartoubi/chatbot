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
exports.ProjectFilesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const uploads_service_1 = require("./uploads.service");
let ProjectFilesController = class ProjectFilesController {
    uploadsService;
    messages;
    constructor(uploadsService, messages) {
        this.uploadsService = uploadsService;
        this.messages = messages;
    }
    async findAll(collectionId, request) {
        const files = await this.uploadsService.findAll(request.userName, collectionId);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('upload.projectFilesReceived'),
            data: files,
        };
    }
};
exports.ProjectFilesController = ProjectFilesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.projectFiles') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.projectFilesReceived') }),
    __param(0, (0, common_1.Param)('collectionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectFilesController.prototype, "findAll", null);
exports.ProjectFilesController = ProjectFilesController = __decorate([
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, swagger_1.ApiTags)('Uploads'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.Controller)('collection/:collectionId/files'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService,
        i18n_message_service_1.I18nMessageService])
], ProjectFilesController);
//# sourceMappingURL=project-files.controller.js.map