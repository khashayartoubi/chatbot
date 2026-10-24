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
exports.TransferHistoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_message_1 = require("../../common/i18n/swagger-message");
class TransferHistoryDto {
    historyId;
    sourceCollectionId;
    targetCollectionId;
}
exports.TransferHistoryDto = TransferHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, description: (0, swagger_message_1.swaggerMessage)('swagger.field.historyId'), example: '58874487695203' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "historyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, description: (0, swagger_message_1.swaggerMessage)('swagger.field.sourceCollectionId'), example: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "sourceCollectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, description: (0, swagger_message_1.swaggerMessage)('swagger.field.targetCollectionId'), example: '10894872377576' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "targetCollectionId", void 0);
//# sourceMappingURL=transfer-history.dto.js.map