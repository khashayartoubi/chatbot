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
exports.RegisterAiFileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_message_1 = require("../../common/i18n/swagger-message");
class RegisterAiFileDto {
    username;
    fileId;
    sourceFileId;
    bucket;
    objectName;
    filename;
    originalName;
    mimeType;
    size;
}
exports.RegisterAiFileDto = RegisterAiFileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'khashayar' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '19479117259861' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "fileId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.sourceFileId'),
        example: '19479117259861',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "sourceFileId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'dana-client' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "bucket", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'khashayar/upload-id/document.pdf' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "objectName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'document.pdf' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'document.pdf' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "originalName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'application/pdf' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMimeType)(),
    __metadata("design:type", String)
], RegisterAiFileDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1024 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], RegisterAiFileDto.prototype, "size", void 0);
//# sourceMappingURL=register-ai-file.dto.js.map