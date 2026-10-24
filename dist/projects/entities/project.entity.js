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
exports.Project = void 0;
const typeorm_1 = require("typeorm");
const chat_entity_1 = require("../../stream/entities/chat.entity");
const upload_entity_1 = require("../../uploads/entities/upload.entity");
let Project = class Project {
    id;
    collectionId;
    name;
    color;
    icon;
    username;
    pinned;
    chats;
    uploads;
    createdAt;
    updatedAt;
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Project.prototype, "collectionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '#3B82F6' }),
    __metadata("design:type", String)
], Project.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], Project.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Project.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "pinned", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_entity_1.Chat, (chat) => chat.project),
    __metadata("design:type", Object)
], Project.prototype, "chats", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => upload_entity_1.Upload, (upload) => upload.project),
    __metadata("design:type", Object)
], Project.prototype, "uploads", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "updatedAt", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects'),
    (0, typeorm_1.Index)('IDX_projects_collectionId', ['collectionId'], { unique: true })
], Project);
//# sourceMappingURL=project.entity.js.map