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
exports.CreateProjectDto = exports.ProjectDataDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const swagger_message_1 = require("../../common/i18n/swagger-message");
const max_length_from_env_validator_1 = require("../../common/validators/max-length-from-env.validator");
class ProjectDataDto {
    name;
    color;
    icon;
}
exports.ProjectDataDto = ProjectDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'My Collection',
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.projectName'),
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, max_length_from_env_validator_1.MaxLengthFromEnv)('COLLECTION_NAME_MAX_LENGTH', 100),
    __metadata("design:type", String)
], ProjectDataDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '#FF5733',
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.projectColor'),
    }),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], ProjectDataDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'folder-icon',
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.projectIcon'),
    }),
    (0, class_validator_1.IsString)(),
    (0, max_length_from_env_validator_1.MaxLengthFromEnv)('COLLECTION_ICON_MAX_LENGTH', 500),
    __metadata("design:type", String)
], ProjectDataDto.prototype, "icon", void 0);
class CreateProjectDto {
    collectionData;
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: ProjectDataDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProjectDataDto),
    __metadata("design:type", ProjectDataDto)
], CreateProjectDto.prototype, "collectionData", void 0);
//# sourceMappingURL=create-project.dto.js.map