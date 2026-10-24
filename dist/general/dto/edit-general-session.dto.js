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
exports.EditGeneralSessionDto = exports.GeneralSessionDataDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class GeneralSessionDataDto {
    historyName;
    translate;
    reasoning;
}
exports.GeneralSessionDataDto = GeneralSessionDataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'نام جدید گفتگو' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], GeneralSessionDataDto.prototype, "historyName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], enum: ['fa', 'en'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(['fa', 'en'], { each: true }),
    __metadata("design:type", Array)
], GeneralSessionDataDto.prototype, "translate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GeneralSessionDataDto.prototype, "reasoning", void 0);
class EditGeneralSessionDto {
    data;
    historyId;
}
exports.EditGeneralSessionDto = EditGeneralSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: GeneralSessionDataDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeneralSessionDataDto),
    __metadata("design:type", GeneralSessionDataDto)
], EditGeneralSessionDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '58874487695203' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EditGeneralSessionDto.prototype, "historyId", void 0);
//# sourceMappingURL=edit-general-session.dto.js.map