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
exports.StreamMultipartDto = exports.StreamMessageDto = exports.StreamChatMessageDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const message_type_enum_1 = require("../enums/message-type.enum");
const selection_mode_enum_1 = require("../enums/selection-mode.enum");
const answer_status_enum_1 = require("../enums/answer-status.enum");
const swagger_message_1 = require("../../common/i18n/swagger-message");
const parseJson = ({ value }) => {
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
};
class StreamChatMessageDto {
    id;
    unread = false;
    type = message_type_enum_1.MessageType.TEXT;
    message = '';
    text;
    letter_operation;
    bot = false;
    avatar = '';
    attachments = [];
    liked = false;
    disLiked = false;
    starred = false;
    delivered = false;
    comment = '';
    reply = [];
    createdAt;
}
exports.StreamChatMessageDto = StreamChatMessageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '26961015353752' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamChatMessageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "unread", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: message_type_enum_1.MessageType,
        default: message_type_enum_1.MessageType.TEXT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(message_type_enum_1.MessageType),
    __metadata("design:type", String)
], StreamChatMessageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: '',
        example: 'سلام',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10_000),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: '',
        example: 'سلام، این متن اصلی پیام است',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10_000),
    __metadata("design:type", String)
], StreamChatMessageDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamChatMessageDto.prototype, "letter_operation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "bot", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.fileIds'),
        default: [],
    }),
    (0, class_transformer_1.Transform)(parseJson),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], StreamChatMessageDto.prototype, "attachments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "liked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "disLiked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "starred", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "delivered", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], StreamChatMessageDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'array',
        items: {},
        default: [],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], StreamChatMessageDto.prototype, "reply", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'date-time',
        example: '2026-07-28T12:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], StreamChatMessageDto.prototype, "createdAt", void 0);
class MessageSchemaDto {
    message;
}
__decorate([
    (0, swagger_1.ApiProperty)({ type: StreamChatMessageDto }),
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StreamChatMessageDto),
    __metadata("design:type", StreamChatMessageDto)
], MessageSchemaDto.prototype, "message", void 0);
class StreamMessageDto {
    answerStatus;
    retry = false;
    historyId;
    collectionId;
    projectId;
    sessionId;
    selectionMode = selection_mode_enum_1.SelectionMode.GENERAL_CHAT;
    letter_operation;
    translate;
    fileIds = [];
    messageSchema;
}
exports.StreamMessageDto = StreamMessageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: answer_status_enum_1.AnswerStatus, default: answer_status_enum_1.AnswerStatus.PENDING }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(answer_status_enum_1.AnswerStatus),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "answerStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: false,
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.retryMessage'),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], StreamMessageDto.prototype, "retry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.newGeneralHistory'),
        example: '58874487695203',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "historyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.nullableProjectId'),
        example: null,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], StreamMessageDto.prototype, "collectionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.legacyProjectId'),
        example: '4f8c878b63b047b5b450ee39760ba249',
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.clientSessionId'),
        example: '10894872377576',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: selection_mode_enum_1.SelectionMode.GENERAL_CHAT,
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.optionalSelectionMode'),
        default: selection_mode_enum_1.SelectionMode.GENERAL_CHAT,
        enum: selection_mode_enum_1.SelectionMode,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(selection_mode_enum_1.SelectionMode),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "selectionMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "letter_operation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StreamMessageDto.prototype, "translate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: (0, swagger_message_1.swaggerMessage)('swagger.field.legacyFileIds'),
        default: [],
    }),
    (0, class_transformer_1.Transform)(parseJson),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], StreamMessageDto.prototype, "fileIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: MessageSchemaDto }),
    (0, class_validator_1.IsDefined)(),
    (0, class_transformer_1.Transform)(parseJson),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MessageSchemaDto),
    __metadata("design:type", MessageSchemaDto)
], StreamMessageDto.prototype, "messageSchema", void 0);
class StreamMultipartDto {
    payload;
}
exports.StreamMultipartDto = StreamMultipartDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: StreamMessageDto }),
    (0, class_transformer_1.Transform)(parseJson),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StreamMessageDto),
    __metadata("design:type", StreamMessageDto)
], StreamMultipartDto.prototype, "payload", void 0);
//# sourceMappingURL=stream-message.dto.js.map