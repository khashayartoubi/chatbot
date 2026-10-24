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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiUploadsController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const register_ai_file_dto_1 = require("./dto/register-ai-file.dto");
const uploads_service_1 = require("./uploads.service");
let AiUploadsController = class AiUploadsController {
    uploadsService;
    configService;
    messages;
    constructor(uploadsService, configService, messages) {
        this.uploadsService = uploadsService;
        this.configService = configService;
        this.messages = messages;
    }
    async register(apiKey, dto) {
        const expectedApiKey = this.configService.get('AI_CALLBACK_API_KEY');
        if (!expectedApiKey || apiKey !== expectedApiKey) {
            throw new common_1.UnauthorizedException(this.messages.translate('auth.invalidAiKey'));
        }
        const file = await this.uploadsService.registerAiFile(dto);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('upload.aiRegistered'),
            data: [
                {
                    fileId: file.fileId,
                    filename: file.filename,
                    originalName: file.originalName,
                    mimeType: file.mimeType,
                    size: Number(file.size),
                    bucket: file.bucket,
                    objectName: file.objectName,
                    fullPath: file.fullPath,
                    tag: file.tag,
                    sourceFileId: file.sourceFileId,
                },
            ],
        };
    }
};
exports.AiUploadsController = AiUploadsController;
__decorate([
    (0, common_1.Post)('ai-file'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.aiRegister') }),
    (0, swagger_1.ApiHeader)({ name: 'x-ai-api-key', required: true }),
    (0, swagger_1.ApiBody)({ type: register_ai_file_dto_1.RegisterAiFileDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.aiRegistered') }),
    __param(0, (0, common_1.Headers)('x-ai-api-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_ai_file_dto_1.RegisterAiFileDto]),
    __metadata("design:returntype", Promise)
], AiUploadsController.prototype, "register", null);
exports.AiUploadsController = AiUploadsController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService,
        config_1.ConfigService,
        i18n_message_service_1.I18nMessageService])
], AiUploadsController);
//# sourceMappingURL=ai-uploads.controller.js.map