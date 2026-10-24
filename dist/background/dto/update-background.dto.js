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
exports.UpdateBackgroundDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const background_fit_enum_1 = require("../enums/background-fit.enum");
class UpdateBackgroundDto {
    userMessageBackgroundColor;
    userMessageTextColor;
    enabled;
    fit;
    overlay;
    blur;
    applyToAll;
}
exports.UpdateBackgroundDto = UpdateBackgroundDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '#3B82F6' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], UpdateBackgroundDto.prototype, "userMessageBackgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '#FFFFFF' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], UpdateBackgroundDto.prototype, "userMessageTextColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBackgroundDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: background_fit_enum_1.BackgroundFit, example: background_fit_enum_1.BackgroundFit.COVER, default: background_fit_enum_1.BackgroundFit.COVER }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(background_fit_enum_1.BackgroundFit),
    __metadata("design:type", String)
], UpdateBackgroundDto.prototype, "fit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '#F5827A66', default: '#F5827A66' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBackgroundDto.prototype, "overlay", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBackgroundDto.prototype, "blur", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBackgroundDto.prototype, "applyToAll", void 0);
//# sourceMappingURL=update-background.dto.js.map