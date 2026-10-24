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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const swagger_message_1 = require("../common/i18n/swagger-message");
const export_session_dto_1 = require("./dto/export-session.dto");
const export_service_1 = require("./export.service");
let ExportController = class ExportController {
    exportService;
    constructor(exportService) {
        this.exportService = exportService;
    }
    async exportSession(dto, request, response) {
        const file = await this.exportService.export(dto, request.userName);
        response
            .status(common_1.HttpStatus.OK)
            .set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${file.filename}"`,
            'Content-Length': file.content.length.toString(),
        })
            .send(file.content);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.export') }),
    (0, swagger_1.ApiBody)({ type: export_session_dto_1.ExportSessionDto }),
    (0, swagger_1.ApiOkResponse)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.exportFile'),
        content: {
            'text/plain': { schema: { type: 'string', format: 'binary' } },
            'application/pdf': { schema: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_session_dto_1.ExportSessionDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportSession", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('Export'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('export-session'),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map