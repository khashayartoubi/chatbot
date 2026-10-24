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
exports.Chat = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../projects/entities/project.entity");
const chat_type_enum_1 = require("../enums/chat-type.enum");
const chat_message_entity_1 = require("./chat-message.entity");
const answer_status_enum_1 = require("../enums/answer-status.enum");
let Chat = class Chat {
    id;
    type;
    username;
    sessionId;
    historyId;
    projectId;
    project;
    messages;
    historyName;
    translate;
    reasoning;
    modelName;
    state;
    waiting;
    answerStatus;
    isActive;
    pinned;
    createdAt;
    updatedAt;
};
exports.Chat = Chat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Chat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: chat_type_enum_1.ChatType }),
    __metadata("design:type", String)
], Chat.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Chat.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Chat.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Chat.prototype, "historyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Chat.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.chats, {
        nullable: true,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({
        name: 'projectId',
        foreignKeyConstraintName: 'FK_chats_project',
    }),
    __metadata("design:type", Object)
], Chat.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_message_entity_1.ChatMessage, (message) => message.chat),
    __metadata("design:type", Object)
], Chat.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], Chat.prototype, "historyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], Chat.prototype, "translate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Chat.prototype, "reasoning", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'gemma4:31b' }),
    __metadata("design:type", String)
], Chat.prototype, "modelName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'done' }),
    __metadata("design:type", String)
], Chat.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Chat.prototype, "waiting", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: answer_status_enum_1.AnswerStatus, default: answer_status_enum_1.AnswerStatus.COMPLETED }),
    __metadata("design:type", String)
], Chat.prototype, "answerStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Chat.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Chat.prototype, "pinned", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Chat.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Chat.prototype, "updatedAt", void 0);
exports.Chat = Chat = __decorate([
    (0, typeorm_1.Entity)('chats'),
    (0, typeorm_1.Index)('IDX_chats_session', ['username', 'sessionId']),
    (0, typeorm_1.Index)('IDX_chats_general_history', ['username', 'historyId']),
    (0, typeorm_1.Index)('IDX_chats_projectId', ['projectId'])
], Chat);
//# sourceMappingURL=chat.entity.js.map