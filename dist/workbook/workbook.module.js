"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbookModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const storage_module_1 = require("../storage/storage.module");
const workbook_entity_1 = require("./entities/workbook.entity");
const workbook_sheet_entity_1 = require("./entities/workbook-sheet.entity");
const workbook_sheets_controller_1 = require("./workbook-sheets.controller");
const workbook_row_entity_1 = require("./entities/workbook-row.entity");
const workbook_analysis_entity_1 = require("./entities/workbook-analysis.entity");
const dana_module_1 = require("../dana/dana.module");
const workbook_analyses_controller_1 = require("./workbook-analyses.controller");
const workbook_controller_1 = require("./workbook.controller");
const workbook_service_1 = require("./workbook.service");
let WorkbookModule = class WorkbookModule {
};
exports.WorkbookModule = WorkbookModule;
exports.WorkbookModule = WorkbookModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([workbook_entity_1.Workbook, workbook_sheet_entity_1.WorkbookSheetEntity, workbook_row_entity_1.WorkbookRow, workbook_analysis_entity_1.WorkbookAnalysis]), auth_module_1.AuthModule, storage_module_1.StorageModule, dana_module_1.DanaModule],
        controllers: [workbook_controller_1.WorkbookController, workbook_sheets_controller_1.WorkbookSheetsController, workbook_analyses_controller_1.WorkbookAnalysesController],
        providers: [workbook_service_1.WorkbookService],
    })
], WorkbookModule);
//# sourceMappingURL=workbook.module.js.map