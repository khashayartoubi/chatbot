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
exports.WorkbookAnalysis = void 0;
const typeorm_1 = require("typeorm");
let WorkbookAnalysis = class WorkbookAnalysis {
    analysisId;
    workbookId;
    versionId;
    organizationId;
    username;
    question;
    chartRequested;
    selectedCells;
    status;
    result;
    error;
    idempotencyKey;
    createdAt;
    updatedAt;
};
exports.WorkbookAnalysis = WorkbookAnalysis;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "analysisId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "workbookId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], WorkbookAnalysis.prototype, "chartRequested", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "selectedCells", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'queued' }),
    __metadata("design:type", String)
], WorkbookAnalysis.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], WorkbookAnalysis.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], WorkbookAnalysis.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", Object)
], WorkbookAnalysis.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], WorkbookAnalysis.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], WorkbookAnalysis.prototype, "updatedAt", void 0);
exports.WorkbookAnalysis = WorkbookAnalysis = __decorate([
    (0, typeorm_1.Entity)('workbook_analyses'),
    (0, typeorm_1.Index)('IDX_workbook_analyses_owner', ['username', 'organizationId'])
], WorkbookAnalysis);
//# sourceMappingURL=workbook-analysis.entity.js.map