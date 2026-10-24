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
exports.ChatMessage = void 0;
const typeorm_1 = require("typeorm");
const chat_entity_1 = require("./chat.entity");
const selection_mode_enum_1 = require("../enums/selection-mode.enum");
const answer_status_enum_1 = require("../enums/answer-status.enum");
let ChatMessage = class ChatMessage {
    id;
    chatId;
    chat;
    sequence;
    unread;
    type;
    selectionMode;
    messageType;
    message;
    text;
    bot;
    answerStatus;
    avatar;
    attachments;
    liked;
    disLiked;
    starred;
    delivered;
    createdAt;
    comment;
    translate;
    reply;
};
exports.ChatMessage = ChatMessage;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ChatMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], ChatMessage.prototype, "chatId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => chat_entity_1.Chat, (chat) => chat.messages, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({
        name: 'chatId',
        foreignKeyConstraintName: 'FK_chat_messages_chat',
    }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "chat", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChatMessage.prototype, "sequence", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "unread", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'text' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "selectionMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "messageType", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ChatMessage.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { default: '' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "bot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: answer_status_enum_1.AnswerStatus, default: answer_status_enum_1.AnswerStatus.COMPLETED }),
    __metadata("design:type", String)
], ChatMessage.prototype, "answerStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], ChatMessage.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "liked", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "disLiked", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "starred", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "delivered", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatMessage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], ChatMessage.prototype, "translate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], ChatMessage.prototype, "reply", void 0);
exports.ChatMessage = ChatMessage = __decorate([
    (0, typeorm_1.Entity)('chat_messages'),
    (0, typeorm_1.Unique)('UQ_chat_messages_sequence', ['chatId', 'sequence'])
], ChatMessage);
//# sourceMappingURL=chat-message.entity.js.map