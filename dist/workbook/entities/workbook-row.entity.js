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
exports.WorkbookRow = void 0;
const typeorm_1 = require("typeorm");
let WorkbookRow = class WorkbookRow {
    id;
    sheetId;
    rowNumber;
    values;
};
exports.WorkbookRow = WorkbookRow;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkbookRow.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WorkbookRow.prototype, "sheetId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WorkbookRow.prototype, "rowNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], WorkbookRow.prototype, "values", void 0);
exports.WorkbookRow = WorkbookRow = __decorate([
    (0, typeorm_1.Entity)('workbook_rows'),
    (0, typeorm_1.Index)('UQ_workbook_rows_sheet_row', ['sheetId', 'rowNumber'], { unique: true })
], WorkbookRow);
//# sourceMappingURL=workbook-row.entity.js.map