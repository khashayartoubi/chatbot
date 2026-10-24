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
exports.WorkbookController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const upload_config_1 = require("../uploads/config/upload.config");
const workbook_service_1 = require("./workbook.service");
const create_analysis_dto_1 = require("./dto/create-analysis.dto");
let WorkbookController = class WorkbookController {
    workbookService;
    messages;
    constructor(workbookService, messages) {
        this.workbookService = workbookService;
        this.messages = messages;
    }
    async create(file, request) {
        if (!file) {
            throw new common_1.BadRequestException(this.messages.translate('workbook.fileRequired'));
        }
        return this.workbookService.create(file, request.userName, this.organizationId(request));
    }
    async findOne(workbookId, request) {
        return this.workbookService.findOne(workbookId, request.userName, this.organizationId(request));
    }
    async getSheets(workbookId, request) {
        return this.workbookService.getSheets(workbookId, request.userName, this.organizationId(request));
    }
    async createAnalysis(workbookId, dto, idempotencyKey, request) {
        return this.workbookService.createAnalysis(workbookId, dto, request.userName, this.organizationId(request), idempotencyKey);
    }
    organizationId(request) {
        const value = request.userInfo['organizationId'] ?? request.userInfo['organization_id'];
        return typeof value === 'string' && value ? value : 'demo';
    }
};
exports.WorkbookController = WorkbookController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.workbook.create') }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, swagger_1.ApiCreatedResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.workbook.created') }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', upload_config_1.uploadOptions)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkbookController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':workbookId'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.workbook.get') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.workbook.received') }),
    __param(0, (0, common_1.Param)('workbookId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkbookController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':workbookId/sheets'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.workbook.sheets') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.workbook.sheetsReceived') }),
    __param(0, (0, common_1.Param)('workbookId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkbookController.prototype, "getSheets", null);
__decorate([
    (0, common_1.Post)(':workbookId/analyses'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.workbook.analysis') }),
    __param(0, (0, common_1.Param)('workbookId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_analysis_dto_1.CreateAnalysisDto, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkbookController.prototype, "createAnalysis", null);
exports.WorkbookController = WorkbookController = __decorate([
    (0, swagger_1.ApiTags)('Excel Assistant'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('excel-assistant/workbooks'),
    __metadata("design:paramtypes", [workbook_service_1.WorkbookService,
        i18n_message_service_1.I18nMessageService])
], WorkbookController);
//# sourceMappingURL=workbook.controller.js.map