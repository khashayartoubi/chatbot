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
exports.ExportSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const export_format_enum_1 = require("../enums/export-format.enum");
class ExportSessionDto {
    historyId = '';
    format = export_format_enum_1.ExportFormat.TEXT;
    collectionId;
}
exports.ExportSessionDto = ExportSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '8f9d2c3a',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportSessionDto.prototype, "historyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: export_format_enum_1.ExportFormat,
        default: export_format_enum_1.ExportFormat.TEXT,
    }),
    (0, class_validator_1.IsIn)(Object.values(export_format_enum_1.ExportFormat)),
    __metadata("design:type", String)
], ExportSessionDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '8f9d2c3a',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportSessionDto.prototype, "collectionId", void 0);
//# sourceMappingURL=export-session.dto.js.map