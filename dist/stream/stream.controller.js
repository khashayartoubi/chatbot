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
exports.StreamController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const upload_config_1 = require("../uploads/config/upload.config");
const stream_message_dto_1 = require("./dto/stream-message.dto");
const stream_payload_pipe_1 = require("./pipes/stream-payload.pipe");
const stream_service_1 = require("./stream.service");
let StreamController = class StreamController {
    streamService;
    messages;
    constructor(streamService, messages) {
        this.streamService = streamService;
        this.messages = messages;
    }
    async stream(files, payload, request) {
        const result = await this.streamService.process(payload, request.userName, files ?? []);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('conversation.processing'),
            data: result,
        };
    }
};
exports.StreamController = StreamController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.stream') }),
    (0, swagger_1.ApiConsumes)('application/json', 'multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: { $ref: (0, swagger_1.getSchemaPath)(stream_message_dto_1.StreamMessageDto) },
    }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('swagger.streamAccepted') }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, upload_config_1.uploadOptions)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)(stream_payload_pipe_1.StreamPayloadPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "stream", null);
exports.StreamController = StreamController = __decorate([
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, swagger_1.ApiTags)('Stream'),
    (0, swagger_1.ApiExtraModels)(stream_message_dto_1.StreamMessageDto, stream_message_dto_1.StreamMultipartDto),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.Controller)('ai-chat-assistant'),
    __metadata("design:paramtypes", [stream_service_1.StreamService,
        i18n_message_service_1.I18nMessageService])
], StreamController);
//# sourceMappingURL=stream.controller.js.map