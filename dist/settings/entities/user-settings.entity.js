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
exports.UserSettings = void 0;
const typeorm_1 = require("typeorm");
const default_language_enum_1 = require("../enums/default-language.enum");
const font_size_enum_1 = require("../enums/font-size.enum");
let UserSettings = class UserSettings {
    id;
    username;
    fontSize;
    defaultLanguage;
    updatedAt;
};
exports.UserSettings = UserSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], UserSettings.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: font_size_enum_1.FontSize.MEDIUM }),
    __metadata("design:type", String)
], UserSettings.prototype, "fontSize", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: default_language_enum_1.DefaultLanguage.PERSIAN,
    }),
    __metadata("design:type", String)
], UserSettings.prototype, "defaultLanguage", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserSettings.prototype, "updatedAt", void 0);
exports.UserSettings = UserSettings = __decorate([
    (0, typeorm_1.Entity)('user_settings')
], UserSettings);
//# sourceMappingURL=user-settings.entity.js.map