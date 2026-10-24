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
exports.Background = void 0;
const typeorm_1 = require("typeorm");
const background_fit_enum_1 = require("../enums/background-fit.enum");
let Background = class Background {
    id;
    username;
    objectName;
    fullPath;
    originalName;
    mimeType;
    userMessageBackgroundColor;
    userMessageTextColor;
    enabled;
    fit;
    overlay;
    blur;
    applyToAll;
    updatedAt;
};
exports.Background = Background;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Background.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Background.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Background.prototype, "objectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Background.prototype, "fullPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Background.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Background.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '#3B82F6' }),
    __metadata("design:type", String)
], Background.prototype, "userMessageBackgroundColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '#FFFFFF' }),
    __metadata("design:type", String)
], Background.prototype, "userMessageTextColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Background.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: background_fit_enum_1.BackgroundFit.COVER }),
    __metadata("design:type", String)
], Background.prototype, "fit", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '#F5827A66' }),
    __metadata("design:type", String)
], Background.prototype, "overlay", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Background.prototype, "blur", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Background.prototype, "applyToAll", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Background.prototype, "updatedAt", void 0);
exports.Background = Background = __decorate([
    (0, typeorm_1.Entity)('user_backgrounds')
], Background);
//# sourceMappingURL=background.entity.js.map