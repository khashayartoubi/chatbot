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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbookSheetEntity = void 0;
const typeorm_1 = require("typeorm");
let WorkbookSheetEntity = class WorkbookSheetEntity {
    sheetId;
    workbookId;
    versionId;
    username;
    sheetName;
    sheetIndex;
    headerRow;
    rowTotal;
    columnTotal;
    hidden;
    headers;
};
exports.WorkbookSheetEntity = WorkbookSheetEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], WorkbookSheetEntity.prototype, "sheetId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WorkbookSheetEntity.prototype, "workbookId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WorkbookSheetEntity.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkbookSheetEntity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkbookSheetEntity.prototype, "sheetName", void 0);
__decorate([
    (0, typeorm_1.Column)('integer'),
    __metadata("design:type", Number)
], WorkbookSheetEntity.prototype, "sheetIndex", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { default: 1 }),
    __metadata("design:type", Number)
], WorkbookSheetEntity.prototype, "headerRow", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'rowCount', default: 0 }),
    __metadata("design:type", Number)
], WorkbookSheetEntity.prototype, "rowTotal", void 0);
__decorate([
    (0, typeorm_1.Column)('integer', { name: 'columnCount', default: 0 }),
    __metadata("design:type", Number)
], WorkbookSheetEntity.prototype, "columnTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], WorkbookSheetEntity.prototype, "hidden", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], WorkbookSheetEntity.prototype, "headers", void 0);
exports.WorkbookSheetEntity = WorkbookSheetEntity = __decorate([
    (0, typeorm_1.Entity)('workbook_sheets'),
    (0, typeorm_1.Index)('UQ_workbook_sheets_workbook_index', ['workbookId', 'sheetIndex'], { unique: true })
], WorkbookSheetEntity);
//# sourceMappingURL=workbook-sheet.entity.js.map