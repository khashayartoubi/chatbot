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
exports.WorkbookSheetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const swagger_message_1 = require("../common/i18n/swagger-message");
const sheet_rows_query_dto_1 = require("./dto/sheet-rows-query.dto");
const workbook_service_1 = require("./workbook.service");
let WorkbookSheetsController = class WorkbookSheetsController {
    workbookService;
    constructor(workbookService) {
        this.workbookService = workbookService;
    }
    async getRows(sheetId, query, request) {
        return this.workbookService.getRows(sheetId, request.userName, this.organizationId(request), query.offset, query.limit);
    }
    organizationId(request) {
        const value = request.userInfo['organizationId'] ?? request.userInfo['organization_id'];
        return typeof value === 'string' && value ? value : 'demo';
    }
};
exports.WorkbookSheetsController = WorkbookSheetsController;
__decorate([
    (0, common_1.Get)(':sheetId/rows'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.workbook.rows') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.workbook.rowsReceived') }),
    __param(0, (0, common_1.Param)('sheetId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sheet_rows_query_dto_1.SheetRowsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], WorkbookSheetsController.prototype, "getRows", null);
exports.WorkbookSheetsController = WorkbookSheetsController = __decorate([
    (0, swagger_1.ApiTags)('Excel Assistant'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('excel-assistant/sheets'),
    __metadata("design:paramtypes", [workbook_service_1.WorkbookService])
], WorkbookSheetsController);
//# sourceMappingURL=workbook-sheets.controller.js.map