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
exports.UpdateProjectDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const max_length_from_env_validator_1 = require("../../common/validators/max-length-from-env.validator");
class ProjectDataDto {
    name;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'نام جدید پروژه' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, max_length_from_env_validator_1.MaxLengthFromEnv)('COLLECTION_NAME_MAX_LENGTH', 100),
    __metadata("design:type", String)
], ProjectDataDto.prototype, "name", void 0);
class UpdateProjectDto {
    collectionId;
    collectionData;
}
exports.UpdateProjectDto = UpdateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '4f8c878b63b047b5b450ee39760ba249' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "collectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ProjectDataDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProjectDataDto),
    __metadata("design:type", ProjectDataDto)
], UpdateProjectDto.prototype, "collectionData", void 0);
//# sourceMappingURL=update-project.dto.js.map