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
exports.StreamPayloadPipe = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const i18n_message_service_1 = require("../../common/i18n/i18n-message.service");
const stream_message_dto_1 = require("../dto/stream-message.dto");
let StreamPayloadPipe = class StreamPayloadPipe {
    messages;
    constructor(messages) {
        this.messages = messages;
    }
    async transform(value) {
        const source = this.isObject(value) && 'payload' in value ? value['payload'] : value;
        const payload = this.parse(source);
        const messageSchema = payload['messageSchema'];
        if (typeof payload['letterOperation'] === 'string' && typeof payload['letter_operation'] !== 'string') {
            payload['letter_operation'] = payload['letterOperation'];
        }
        if (this.isObject(messageSchema) && !this.isObject(messageSchema['message'])) {
            payload['messageSchema'] = { message: { ...messageSchema } };
        }
        const dto = (0, class_transformer_1.plainToInstance)(stream_message_dto_1.StreamMessageDto, payload);
        const errors = await (0, class_validator_1.validate)(dto, {
            whitelist: true,
            forbidNonWhitelisted: false,
        });
        if (errors.length) {
            throw new common_1.BadRequestException(this.messages.translate('payload.invalid'));
        }
        return dto;
    }
    parse(value) {
        if (this.isObject(value)) {
            return { ...value };
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(this.messages.translate('payload.required'));
        }
        try {
            const parsed = JSON.parse(value);
            if (!this.isObject(parsed)) {
                throw new Error();
            }
            return parsed;
        }
        catch {
            throw new common_1.BadRequestException(this.messages.translate('payload.invalidJson'));
        }
    }
    isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
};
exports.StreamPayloadPipe = StreamPayloadPipe;
exports.StreamPayloadPipe = StreamPayloadPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [i18n_message_service_1.I18nMessageService])
], StreamPayloadPipe);
//# sourceMappingURL=stream-payload.pipe.js.map