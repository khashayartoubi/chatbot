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
exports.WorkbookAnalysesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const swagger_message_1 = require("../common/i18n/swagger-message");
const workbook_service_1 = require("./workbook.service");
let WorkbookAnalysesController = class WorkbookAnalysesController {
    workbookService;
    constructor(workbookService) {
        this.workbookService = workbookService;
    }
    async findOne(analysisId, request) {
        const value = request.userInfo['organizationId'] ?? request.userInfo['organization_id'];
        const organizationId = typeof value === 'string' && value ? value : 'demo';
        return this.workbookService.getAnalysis(analysisId, request.userName, organizationId);
    }
};
exports.WorkbookAnalysesController = WorkbookAnalysesController;
__decorate([
    (0, common_1.Get)(':analysisId'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.workbook.getAnalysis') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.workbook.analysisReceived') }),
    __param(0, (0, common_1.Param)('analysisId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkbookAnalysesController.prototype, "findOne", null);
exports.WorkbookAnalysesController = WorkbookAnalysesController = __decorate([
    (0, swagger_1.ApiTags)('Excel Assistant'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('excel-assistant/analyses'),
    __metadata("design:paramtypes", [workbook_service_1.WorkbookService])
], WorkbookAnalysesController);
//# sourceMappingURL=workbook-analyses.controller.js.map