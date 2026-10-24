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
exports.SaveGraphPositionDto = exports.NodePositionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class NodePositionDto {
    id;
    fx;
    fy;
}
exports.NodePositionDto = NodePositionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NodePositionDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NodePositionDto.prototype, "fx", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NodePositionDto.prototype, "fy", void 0);
class SaveGraphPositionDto {
    position;
}
exports.SaveGraphPositionDto = SaveGraphPositionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NodePositionDto),
    __metadata("design:type", Array)
], SaveGraphPositionDto.prototype, "position", void 0);
//# sourceMappingURL=save-graph-position.dto.js.map